"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = exports.placeOrder = void 0;
const db_1 = require("../config/db");
const firestore_1 = require("../utils/firestore");
const email_1 = require("../utils/email");
const firebase_1 = require("../utils/firebase");
const shippingByMethod = {
    lalamove: 200,
    jnt: 150,
    pickup: 0,
};
const isDeliveryMethod = (value) => value === "lalamove" || value === "jnt" || value === "pickup";
const placeOrder = async (req, res) => {
    const userId = req.user?.id;
    const { address, deliveryMethod } = req.body;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (typeof address?.fullName !== "string" ||
        !address.fullName.trim() ||
        typeof address?.phone !== "string" ||
        !address.phone.trim() ||
        typeof address?.addressLine !== "string" ||
        !address.addressLine.trim()) {
        return res.status(400).json({ message: "A complete delivery address is required" });
    }
    if (!isDeliveryMethod(deliveryMethod)) {
        return res.status(400).json({ message: "Choose a valid delivery method." });
    }
    try {
        const outcome = await db_1.db.runTransaction(async (transaction) => {
            const cartQuery = (0, firestore_1.collection)("cart").where("user_id", "==", userId).limit(1);
            const cartQuerySnapshot = await transaction.get(cartQuery);
            const cartSnapshot = cartQuerySnapshot.docs[0];
            if (!cartSnapshot)
                throw new Error("CART_EMPTY");
            const cart = (0, firestore_1.snapshotData)(cartSnapshot);
            if (!cart)
                throw new Error("CART_EMPTY");
            const cartItemsSnapshot = await transaction.get((0, firestore_1.collection)("cart_items").where("cart_id", "==", Number(cart.id)));
            const cartItems = cartItemsSnapshot.docs.map(firestore_1.snapshotData).filter(Boolean);
            if (!cartItems.length)
                throw new Error("CART_EMPTY");
            if (cartItems.length > 200)
                throw new Error("CART_TOO_LARGE");
            const productRefs = cartItems.map((item) => (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(item.product_id)));
            const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
            const products = productSnapshots.map(firestore_1.snapshotData);
            const userRef = (0, firestore_1.collection)("users").doc((0, firestore_1.documentId)(userId));
            const orderCounterRef = (0, firestore_1.collection)("_counters").doc("orders");
            const [userSnapshot, counterSnapshot] = await Promise.all([
                transaction.get(userRef),
                transaction.get(orderCounterRef),
            ]);
            const user = (0, firestore_1.snapshotData)(userSnapshot);
            if (!user)
                throw new Error("USER_NOT_FOUND");
            const orderId = Number(counterSnapshot.data()?.value || 0) + 1;
            const orderRef = (0, firestore_1.collection)("orders").doc((0, firestore_1.documentId)(orderId));
            const now = new Date();
            const productById = new Map();
            products.forEach((product) => {
                if (product)
                    productById.set(Number(product.id), product);
            });
            let subtotalCents = 0;
            const orderItems = cartItems.map((item) => {
                const product = productById.get(Number(item.product_id));
                if (!product)
                    throw new Error(`PRODUCT_NOT_FOUND:${item.product_id}`);
                const quantity = Number(item.quantity);
                const priceCents = Math.round(Number(product.price) * 100);
                if (!Number.isInteger(quantity) ||
                    quantity <= 0 ||
                    quantity > Number(product.stock)) {
                    throw new Error(`INSUFFICIENT_STOCK:${product.id}`);
                }
                if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
                    throw new Error(`INVALID_PRICE:${product.id}`);
                }
                subtotalCents += priceCents * quantity;
                if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 9999999999) {
                    throw new Error("ORDER_TOTAL_LIMIT");
                }
                return {
                    itemId: item.id,
                    product_id: Number(product.id),
                    product_name: product.name,
                    quantity,
                    price: priceCents / 100,
                    stock: Number(product.stock),
                };
            });
            const shippingCents = shippingByMethod[deliveryMethod] * 100;
            if (subtotalCents + shippingCents > 9999999999) {
                throw new Error("ORDER_TOTAL_LIMIT");
            }
            const total = (subtotalCents + shippingCents) / 100;
            transaction.set(orderCounterRef, { value: orderId });
            transaction.create(orderRef, {
                id: orderId,
                user_id: userId,
                total,
                status: "placed",
                delivery_method: deliveryMethod,
                created_at: now,
            });
            transaction.create((0, firestore_1.collection)("order_addresses").doc((0, firestore_1.documentId)(orderId)), {
                order_id: orderId,
                full_name: address.fullName.trim(),
                phone: address.phone.trim(),
                address_line: address.addressLine.trim(),
                province: address.province || "",
                municipality: address.municipality || "",
                barangay: address.barangay || "",
                postal_code: address.postal || address.postalCode || "",
                country: address.country || "Philippines",
            });
            orderItems.forEach((item, index) => {
                const productRef = productRefs[index];
                transaction.update(productRef, { stock: item.stock - item.quantity });
                const orderItemId = `${orderId}_${item.product_id}`;
                transaction.create((0, firestore_1.collection)("order_items").doc(orderItemId), {
                    id: orderItemId,
                    order_id: orderId,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                });
                transaction.delete((0, firestore_1.collection)("cart_items").doc((0, firestore_1.documentId)(item.itemId)));
            });
            return {
                orderId,
                total,
                customerName: user.fullname,
                customerEmail: user.email,
                items: orderItems.map(({ product_name, quantity, price }) => ({
                    name: product_name,
                    quantity,
                    price,
                })),
            };
        });
        try {
            await (0, email_1.sendOrderPlacedEmail)({
                recipientEmail: outcome.customerEmail,
                customerName: outcome.customerName,
                orderId: outcome.orderId,
                total: outcome.total,
                deliveryMethod,
                items: outcome.items,
            });
        }
        catch (error) {
            console.error("Order email notification failed", error);
        }
        try {
            await (0, firebase_1.notifyUserById)({
                userId,
                title: "Order placed",
                body: `Your order #${outcome.orderId} has been placed successfully.`,
                data: {
                    type: "order_placed",
                    orderId: String(outcome.orderId),
                    total: String(outcome.total),
                },
            });
        }
        catch (error) {
            console.error("Order push notification failed", error);
        }
        return res.json({
            message: "Order placed",
            orderId: outcome.orderId,
            total: outcome.total,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            if (error.message === "CART_EMPTY")
                return res.status(400).json({ message: "Cart is empty" });
            if (error.message === "CART_TOO_LARGE") {
                return res.status(400).json({ message: "Orders are limited to 200 distinct products." });
            }
            if (error.message === "USER_NOT_FOUND")
                return res.status(401).json({ message: "Account not found" });
            if (error.message === "ORDER_TOTAL_LIMIT") {
                return res.status(400).json({ message: "Order total exceeds the supported limit." });
            }
            if (error.message.startsWith("PRODUCT_NOT_FOUND:")) {
                return res.status(400).json({ message: "A cart product is no longer available." });
            }
            if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
                return res.status(400).json({ message: "Insufficient stock for one or more products." });
            }
            if (error.message.startsWith("INVALID_PRICE:")) {
                console.error("Invalid stored product price", error.message);
                return res.status(500).json({ message: "Unable to place order" });
            }
        }
        console.error("Order placement error", error);
        return res.status(500).json({ message: "Unable to place order" });
    }
};
exports.placeOrder = placeOrder;
const getOrders = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const [orders, statuses] = await Promise.all([
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("orders").where("user_id", "==", userId)),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_status")),
        ]);
        orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const result = await Promise.all(orders.map(async (order) => {
            const items = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_items").where("order_id", "==", Number(order.id)));
            const productSnapshots = items.length
                ? await db_1.db.getAll(...items.map((item) => (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(item.product_id))))
                : [];
            const products = new Map(productSnapshots
                .map(firestore_1.snapshotData)
                .filter((product) => product !== null)
                .map((product) => [Number(product.id), product]));
            return {
                id: order.id,
                total: order.total,
                delivery_method: order.delivery_method,
                created_at: order.created_at,
                status: statuses.find((entry) => entry.code === order.status ||
                    entry.name === order.status ||
                    Number(entry.id) === Number(order.status))?.name || order.status,
                items: items.map((item) => ({
                    id: item.id,
                    product_id: item.product_id,
                    product_name: products.get(Number(item.product_id))?.name || `Product #${item.product_id}`,
                    quantity: item.quantity,
                    price: item.price,
                })),
            };
        }));
        return res.json(result);
    }
    catch (error) {
        console.error("Get orders error", error);
        return res.status(500).json({ message: "Unable to retrieve orders" });
    }
};
exports.getOrders = getOrders;
//# sourceMappingURL=orderController.js.map