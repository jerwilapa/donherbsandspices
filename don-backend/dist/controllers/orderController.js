"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = exports.placeOrder = void 0;
const db_1 = require("../config/db");
const email_1 = require("../utils/email");
const firebase_1 = require("../utils/firebase");
const getStatusValue = async (conn, statusCode) => {
    try {
        const [rows] = await conn.query("SELECT id FROM order_status WHERE code = ? OR name = ? LIMIT 1", [statusCode, statusCode]);
        if (rows.length > 0) {
            return rows[0].id;
        }
    }
    catch (_err) {
        // ignore missing table/column and fall back to text status
    }
    return statusCode;
};
/**
 * Persist an order and its items.
 * Tables assumed to exist:
 *  - orders(id, user_id, total, status, delivery_method, created_at)
 *  - order_items(id, order_id, product_id, quantity, price)
 */
const placeOrder = async (req, res) => {
    const { userId, items, address, deliveryMethod, shipping, total } = req.body;
    if (!userId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Invalid order payload" });
    }
    let conn;
    try {
        conn = await db_1.db.getConnection();
        await conn.beginTransaction();
        // Verify cart exists
        const [cartRows] = await conn.query("SELECT * FROM cart WHERE user_id = ?", [userId]);
        if (cartRows.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ message: "Cart is empty" });
        }
        const cartId = cartRows[0].id;
        // Load cart items with product info
        const [cartItems] = await conn.query(`SELECT ci.product_id, ci.quantity, p.price, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?`, [cartId]);
        if (cartItems.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ message: "Cart is empty" });
        }
        // Check stock availability
        for (const ci of cartItems) {
            if (ci.quantity > ci.stock) {
                await conn.rollback();
                conn.release();
                return res
                    .status(400)
                    .json({ message: `Product ${ci.product_id} is out of stock` });
            }
        }
        // Lookup status from a status table if it exists, otherwise use literal status code.
        const mappedStatus = await getStatusValue(conn, "placed");
        let orderId;
        try {
            const [orderResult] = await conn.query("INSERT INTO orders (user_id, total, status, delivery_method) VALUES (?, ?, ?, ?)", [userId, total || 0, mappedStatus, deliveryMethod || null]);
            orderId = orderResult.insertId;
        }
        catch (insertErr) {
            // ER_BAD_FIELD_ERROR (unknown column) when delivery_method is missing
            if (insertErr && insertErr.code === "ER_BAD_FIELD_ERROR") {
                const [orderResult] = await conn.query("INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)", [userId, total || 0, mappedStatus]);
                orderId = orderResult.insertId;
            }
            else {
                throw insertErr;
            }
        }
        // Insert order items and reduce stock
        for (const it of items) {
            const productId = it.productId ?? it.product_id;
            const qty = it.quantity;
            const found = cartItems.find((c) => c.product_id == productId);
            const price = found ? found.price : it.price || 0;
            await conn.query("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)", [orderId, productId, qty, price]);
            await conn.query("UPDATE products SET stock = stock - ? WHERE id = ?", [
                qty,
                productId,
            ]);
        }
        // Clear cart
        await conn.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);
        await conn.query("DELETE FROM cart WHERE id = ?", [cartId]);
        await conn.commit();
        conn.release();
        try {
            const [userRows] = await db_1.db.query("SELECT fullname, email FROM users WHERE id = ?", [userId]);
            const customer = userRows?.[0] || {};
            const orderItems = items.map((it) => ({
                name: it.productName || it.name || "Product",
                quantity: it.quantity,
                price: it.price || 0,
            }));
            await (0, email_1.sendOrderPlacedEmail)({
                recipientEmail: customer.email,
                customerName: customer.fullname,
                orderId,
                total,
                deliveryMethod,
                items: orderItems,
            });
        }
        catch (emailErr) {
            console.error("Order email notification failed", emailErr);
        }
        try {
            await (0, firebase_1.notifyUserById)({
                userId,
                title: "Order placed",
                body: `Your order #${orderId} has been placed successfully.`,
                data: {
                    type: "order_placed",
                    orderId: String(orderId),
                    total: String(total || 0),
                },
            });
        }
        catch (pushErr) {
            console.error("Order push notification failed", pushErr);
        }
        res.json({ message: "Order placed", orderId });
    }
    catch (err) {
        // Log full error for debugging in server console
        console.error("Order placement error:", err);
        if (conn) {
            try {
                await conn.rollback();
                conn.release();
            }
            catch (e) {
                // ignore
            }
        }
        res.status(500).json({ message: "Unable to place order", error: err });
    }
};
exports.placeOrder = placeOrder;
const getOrders = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        let rows;
        try {
            const [result] = await db_1.db.query(`SELECT o.id AS orderId, o.total, o.delivery_method, o.created_at,
                COALESCE(os.name, o.status) AS status,
                oi.id AS order_item_id,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.name AS product_name
           FROM orders o
           LEFT JOIN order_status os ON os.id = o.status OR os.code = o.status OR os.name = o.status
           LEFT JOIN order_items oi ON oi.order_id = o.id
           LEFT JOIN products p ON p.id = oi.product_id
          WHERE o.user_id = ?
          ORDER BY o.created_at DESC, o.id DESC`, [userId]);
            const grouped = {};
            for (const row of result) {
                if (!grouped[row.orderId]) {
                    grouped[row.orderId] = {
                        id: row.orderId,
                        total: row.total,
                        delivery_method: row.delivery_method,
                        created_at: row.created_at,
                        status: row.status,
                        items: [],
                    };
                }
                if (row.order_item_id) {
                    grouped[row.orderId].items.push({
                        id: row.order_item_id,
                        product_id: row.product_id,
                        product_name: row.product_name,
                        quantity: row.quantity,
                        price: row.price,
                    });
                }
            }
            rows = Object.values(grouped);
        }
        catch (queryErr) {
            if (queryErr &&
                (queryErr.code === "ER_NO_SUCH_TABLE" ||
                    queryErr.code === "ER_BAD_FIELD_ERROR")) {
                const [result] = await db_1.db.query(`SELECT o.id AS orderId, o.total, o.delivery_method, o.created_at, o.status,
                  oi.id AS order_item_id,
                  oi.product_id,
                  oi.quantity,
                  oi.price,
                  p.name AS product_name
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             LEFT JOIN products p ON p.id = oi.product_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC, o.id DESC`, [userId]);
                const grouped = {};
                for (const row of result) {
                    if (!grouped[row.orderId]) {
                        grouped[row.orderId] = {
                            id: row.orderId,
                            total: row.total,
                            delivery_method: row.delivery_method,
                            created_at: row.created_at,
                            status: row.status,
                            items: [],
                        };
                    }
                    if (row.order_item_id) {
                        grouped[row.orderId].items.push({
                            id: row.order_item_id,
                            product_id: row.product_id,
                            product_name: row.product_name,
                            quantity: row.quantity,
                            price: row.price,
                        });
                    }
                }
                rows = Object.values(grouped);
            }
            else {
                throw queryErr;
            }
        }
        res.json(rows);
    }
    catch (err) {
        console.error("Get orders error:", err);
        res.status(500).json({ message: "Unable to retrieve orders", error: err });
    }
};
exports.getOrders = getOrders;
//# sourceMappingURL=orderController.js.map