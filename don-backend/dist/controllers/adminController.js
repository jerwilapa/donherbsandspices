"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoriesAdmin = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsAdmin = exports.updateOrderStatus = exports.getOrdersAdmin = void 0;
const db_1 = require("../config/db");
const firebase_1 = require("../utils/firebase");
const resolveStatusValue = async (conn, statusCode) => {
    try {
        const [rows] = await conn.query("SELECT id FROM order_status WHERE code = ? OR name = ? LIMIT 1", [statusCode, statusCode]);
        if (rows.length > 0)
            return rows[0].id;
    }
    catch (_err) {
        // ignore and fall back to literal
    }
    return statusCode;
};
const getOrdersAdmin = async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`SELECT o.id, o.user_id, o.total, o.delivery_method, o.created_at,
              MAX(COALESCE(os.name, o.status)) AS status,
              COUNT(oi.id) AS itemCount
         FROM orders o
         LEFT JOIN order_status os ON os.id = o.status OR os.code = o.status OR os.name = o.status
         LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id
        ORDER BY o.created_at DESC`);
        res.json(rows);
    }
    catch (error) {
        console.error("Admin get orders error", error);
        res.status(500).json({ message: "Unable to fetch orders", error });
    }
};
exports.getOrdersAdmin = getOrdersAdmin;
const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }
    try {
        // If order_status table exists, try to resolve provided status (name/code) to its id
        let statusToSet = status;
        try {
            const resolved = await resolveStatusValue(db_1.db, status);
            statusToSet = resolved;
        }
        catch (_e) {
            // ignore and use literal value
        }
        await db_1.db.query("UPDATE orders SET status = ? WHERE id = ?", [
            statusToSet,
            orderId,
        ]);
        try {
            const [orderRows] = await db_1.db.query("SELECT user_id FROM orders WHERE id = ?", [orderId]);
            const userId = orderRows?.[0]?.user_id;
            if (userId) {
                await (0, firebase_1.notifyUserById)({
                    userId,
                    title: "Order status updated",
                    body: `Your order #${orderId} is now ${status}.`,
                    data: {
                        type: "order_status",
                        orderId: String(orderId),
                        status: String(status),
                    },
                });
            }
        }
        catch (notifyError) {
            console.error("Order status notification failed", notifyError);
        }
        res.json({ message: "Order status updated" });
    }
    catch (error) {
        console.error("Admin update order status error", error);
        res.status(500).json({ message: "Unable to update order status", error });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getProductsAdmin = async (req, res) => {
    try {
        const [rows] = await db_1.db.query("SELECT * FROM products ORDER BY id DESC");
        res.json(rows);
    }
    catch (error) {
        console.error("Admin get products error", error);
        res.status(500).json({ message: "Unable to fetch products", error });
    }
};
exports.getProductsAdmin = getProductsAdmin;
const createProduct = async (req, res) => {
    const { name, price, stock, category_id } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ message: "Name and price are required" });
    }
    try {
        if (category_id !== null &&
            category_id !== undefined &&
            category_id !== "") {
            const [categoryRows] = await db_1.db.query("SELECT id FROM categories WHERE id = ?", [category_id]);
            if (categoryRows.length === 0) {
                return res.status(400).json({ message: "Category not found" });
            }
        }
        // ✅ FIX: get uploaded file
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : "";
        const [result] = await db_1.db.query("INSERT INTO products (name, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?)", [name, price, stock || 0, imageUrl, category_id || null]);
        res.status(201).json({
            message: "Product created",
            id: result.insertId,
            image: imageUrl,
        });
    }
    catch (error) {
        console.error("Admin create product error", error);
        res.status(500).json({ message: "Unable to create product", error });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { productId } = req.params;
    try {
        const { name, price, stock, category_id } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ message: "Name and price are required" });
        }
        if (category_id !== null &&
            category_id !== undefined &&
            category_id !== "") {
            const [categoryRows] = await db_1.db.query("SELECT id FROM categories WHERE id = ?", [category_id]);
            if (categoryRows.length === 0) {
                return res.status(400).json({ message: "Category not found" });
            }
        }
        // 🔥 FIX: always ensure safe image value
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/products/${req.file.filename}`;
        }
        // fallback to existing image from DB
        if (!imageUrl) {
            const [rows] = await db_1.db.query("SELECT image FROM products WHERE id = ?", [productId]);
            imageUrl = rows?.[0]?.image || "";
        }
        await db_1.db.query(`UPDATE products 
       SET name = ?, price = ?, stock = ?, image = ?, category_id = ? 
       WHERE id = ?`, [name, price, stock, imageUrl, category_id || null, productId]);
        res.json({ message: "Product updated" });
    }
    catch (error) {
        console.error("Admin update product error", error);
        res.status(500).json({ message: "Unable to update product", error });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { productId } = req.params;
    try {
        // delete dependent rows first
        await db_1.db.query("DELETE FROM order_items WHERE product_id = ?", [productId]);
        await db_1.db.query("DELETE FROM products WHERE id = ?", [productId]);
        res.json({ message: "Product deleted" });
    }
    catch (error) {
        console.error("Admin delete product error", error);
        res.status(500).json({
            message: "Unable to delete product",
            error,
        });
    }
};
exports.deleteProduct = deleteProduct;
const getCategoriesAdmin = async (req, res) => {
    try {
        const [rows] = await db_1.db.query("SELECT * FROM categories ORDER BY id DESC");
        res.json(rows);
    }
    catch (error) {
        console.error("Admin get categories error", error);
        res.status(500).json({ message: "Unable to fetch categories", error });
    }
};
exports.getCategoriesAdmin = getCategoriesAdmin;
const createCategory = async (req, res) => {
    const { name, image } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Name is required" });
    }
    try {
        const [result] = await db_1.db.query("INSERT INTO categories (name, image) VALUES (?, ?)", [name, image || ""]);
        res.status(201).json({ message: "Category created", id: result.insertId });
    }
    catch (error) {
        console.error("Admin create category error", error);
        res.status(500).json({ message: "Unable to create category", error });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { name, image } = req.body;
    try {
        await db_1.db.query("UPDATE categories SET name = ?, image = ? WHERE id = ?", [
            name,
            image,
            categoryId,
        ]);
        res.json({ message: "Category updated" });
    }
    catch (error) {
        console.error("Admin update category error", error);
        res.status(500).json({ message: "Unable to update category", error });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    try {
        await db_1.db.query("DELETE FROM categories WHERE id = ?", [categoryId]);
        res.json({ message: "Category deleted" });
    }
    catch (error) {
        console.error("Admin delete category error", error);
        res.status(500).json({ message: "Unable to delete category", error });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=adminController.js.map