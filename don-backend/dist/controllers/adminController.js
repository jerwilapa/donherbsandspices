"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminCustomers = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoriesAdmin = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsAdmin = exports.updateOrderStatus = exports.getAdminOrderDetails = exports.getOrdersAdmin = void 0;
const db_1 = require("../config/db");
const firestore_1 = require("../utils/firestore");
const firebase_1 = require("../utils/firebase");
const productImage_1 = require("../utils/productImage");
const numericId = (value) => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const getOrdersAdmin = async (_req, res) => {
    try {
        const [orders, users, items, statuses] = await Promise.all([
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("orders")),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("users")),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_items")),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_status")),
        ]);
        const usersById = new Map(users.map((user) => [Number(user.id), user]));
        const counts = new Map();
        items.forEach((item) => {
            const orderId = Number(item.order_id);
            counts.set(orderId, (counts.get(orderId) || 0) + 1);
        });
        const orderList = orders.map((order) => {
            const user = usersById.get(Number(order.user_id));
            const status = statuses.find((entry) => entry.code === order.status ||
                entry.name === order.status ||
                Number(entry.id) === Number(order.status));
            return {
                id: order.id,
                user_id: order.user_id,
                customer_name: user?.fullname || "Unknown customer",
                customer_email: user?.email || "",
                total: order.total,
                delivery_method: order.delivery_method,
                created_at: order.created_at,
                status: status?.name || order.status,
                itemCount: counts.get(Number(order.id)) || 0,
            };
        });
        orderList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return res.json(orderList);
    }
    catch (error) {
        console.error("Admin get orders error", error);
        return res.status(500).json({ message: "Unable to fetch orders" });
    }
};
exports.getOrdersAdmin = getOrdersAdmin;
const getAdminOrderDetails = async (req, res) => {
    const orderId = numericId(typeof req.params.orderId === "string" ? req.params.orderId : "");
    if (!orderId)
        return res.status(400).json({ message: "Invalid order ID" });
    try {
        const [order, items, addresses, statuses] = await Promise.all([
            (0, firestore_1.getDocument)("orders", orderId),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_items").where("order_id", "==", orderId)),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_addresses").where("order_id", "==", orderId)),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("order_status")),
        ]);
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        const customer = await (0, firestore_1.getDocument)("users", order.user_id);
        const address = addresses[0];
        const productSnapshots = items.length
            ? await db_1.db.getAll(...items.map((item) => (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(item.product_id))))
            : [];
        const products = new Map(productSnapshots
            .map((snapshot) => ({ data: snapshot.data(), id: snapshot.id }))
            .filter((entry) => entry.data)
            .map((entry) => [Number(entry.data.id ?? entry.id), entry.data.name]));
        const status = statuses.find((entry) => entry.code === order.status ||
            entry.name === order.status ||
            Number(entry.id) === Number(order.status));
        return res.json({
            id: order.id,
            user_id: order.user_id,
            customer_name: customer?.fullname || "Unknown customer",
            customer_email: customer?.email || "",
            total: order.total,
            delivery_method: order.delivery_method,
            created_at: order.created_at,
            status: status?.name || order.status,
            full_name: address?.full_name || "",
            phone: address?.phone || "",
            address_line: address?.address_line || "",
            province: address?.province || "",
            municipality: address?.municipality || "",
            barangay: address?.barangay || "",
            postal_code: address?.postal_code || "",
            country: address?.country || "",
            items: items.map((item) => ({
                id: item.id,
                product_id: item.product_id,
                product_name: products.get(Number(item.product_id)) || `Product #${item.product_id}`,
                quantity: item.quantity,
                price: item.price,
            })),
        });
    }
    catch (error) {
        console.error("Admin get order details error", error);
        return res.status(500).json({ message: "Unable to fetch order details" });
    }
};
exports.getAdminOrderDetails = getAdminOrderDetails;
const updateOrderStatus = async (req, res) => {
    const orderId = numericId(typeof req.params.orderId === "string" ? req.params.orderId : "");
    const status = req.body?.status;
    if (!orderId)
        return res.status(400).json({ message: "Invalid order ID" });
    if (typeof status !== "string" || !status.trim()) {
        return res.status(400).json({ message: "Status is required" });
    }
    try {
        const orderRef = (0, firestore_1.collection)("orders").doc((0, firestore_1.documentId)(orderId));
        const order = await db_1.db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(orderRef);
            if (!snapshot.exists)
                return null;
            const statusQuery = await transaction.get((0, firestore_1.collection)("order_status")
                .where("code", "==", status.trim())
                .limit(1));
            let statusEntry = statusQuery.docs[0]?.data();
            if (!statusEntry) {
                const byName = await transaction.get((0, firestore_1.collection)("order_status").where("name", "==", status.trim()).limit(1));
                statusEntry = byName.docs[0]?.data();
            }
            if (!statusEntry)
                throw new Error("INVALID_ORDER_STATUS");
            const normalizedStatus = statusEntry.code || statusEntry.name;
            transaction.update(orderRef, { status: normalizedStatus });
            return snapshot.data();
        });
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        try {
            await (0, firebase_1.notifyUserById)({
                userId: Number(order.user_id),
                title: "Order status updated",
                body: `Your order #${orderId} is now ${status.trim()}.`,
                data: { type: "order_status", orderId: String(orderId), status: status.trim() },
            });
        }
        catch (error) {
            console.error("Order status notification failed", error);
        }
        return res.json({ message: "Order status updated" });
    }
    catch (error) {
        if (error instanceof Error && error.message === "INVALID_ORDER_STATUS") {
            return res.status(400).json({ message: "Choose a valid order status." });
        }
        console.error("Admin update order status error", error);
        return res.status(500).json({ message: "Unable to update order status" });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getProductsAdmin = async (_req, res) => {
    try {
        const products = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("products"));
        return res.json(products
            .map((product) => ({
            ...product,
            image: (0, productImage_1.resolveProductImage)(product.name, product.image),
        }))
            .sort((a, b) => Number(b.id) - Number(a.id)));
    }
    catch (error) {
        console.error("Admin get products error", error);
        return res.status(500).json({ message: "Unable to fetch products" });
    }
};
exports.getProductsAdmin = getProductsAdmin;
const createProduct = async (req, res) => {
    const { name, price, stock, category_id } = req.body;
    const parsedPrice = Number(price);
    const parsedStock = Number(stock || 0);
    const parsedCategory = category_id ? Number(category_id) : null;
    if (typeof name !== "string" ||
        !name.trim() ||
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0 ||
        !Number.isSafeInteger(parsedStock) ||
        parsedStock < 0) {
        return res.status(400).json({ message: "Provide a name and valid price and stock." });
    }
    try {
        if (parsedCategory !== null && !(await (0, firestore_1.getDocument)("categories", parsedCategory))) {
            return res.status(400).json({ message: "Category not found" });
        }
        const id = await (0, firestore_1.allocateId)("products");
        const image = req.file ? `/uploads/products/${req.file.filename}` : "";
        await (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(id)).create({
            id,
            name: name.trim(),
            price: parsedPrice,
            stock: parsedStock,
            image,
            category_id: parsedCategory,
            created_at: new Date(),
        });
        return res.status(201).json({ message: "Product created", id, image });
    }
    catch (error) {
        console.error("Admin create product error", error);
        return res.status(500).json({ message: "Unable to create product" });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const productId = numericId(typeof req.params.productId === "string" ? req.params.productId : "");
    const { name, price, stock, category_id } = req.body;
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedCategory = category_id ? Number(category_id) : null;
    if (!productId)
        return res.status(400).json({ message: "Invalid product ID" });
    if (typeof name !== "string" ||
        !name.trim() ||
        !Number.isFinite(parsedPrice) ||
        parsedPrice < 0 ||
        !Number.isSafeInteger(parsedStock) ||
        parsedStock < 0) {
        return res.status(400).json({ message: "Provide a name and valid price and stock." });
    }
    try {
        if (parsedCategory !== null && !(await (0, firestore_1.getDocument)("categories", parsedCategory))) {
            return res.status(400).json({ message: "Category not found" });
        }
        const productRef = (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(productId));
        const product = await productRef.get();
        if (!product.exists)
            return res.status(404).json({ message: "Product not found" });
        await productRef.update({
            name: name.trim(),
            price: parsedPrice,
            stock: parsedStock,
            image: req.file
                ? `/uploads/products/${req.file.filename}`
                : product.data()?.image || "",
            category_id: parsedCategory,
        });
        return res.json({ message: "Product updated" });
    }
    catch (error) {
        console.error("Admin update product error", error);
        return res.status(500).json({ message: "Unable to update product" });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const productId = numericId(typeof req.params.productId === "string" ? req.params.productId : "");
    if (!productId)
        return res.status(400).json({ message: "Invalid product ID" });
    try {
        const productRef = (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(productId));
        const product = await productRef.get();
        if (!product.exists)
            return res.status(404).json({ message: "Product not found" });
        await productRef.delete();
        return res.json({ message: "Product deleted" });
    }
    catch (error) {
        console.error("Admin delete product error", error);
        return res.status(500).json({ message: "Unable to delete product" });
    }
};
exports.deleteProduct = deleteProduct;
const getCategoriesAdmin = async (_req, res) => {
    try {
        const categories = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("categories"));
        return res.json(categories.sort((a, b) => Number(b.id) - Number(a.id)));
    }
    catch (error) {
        console.error("Admin get categories error", error);
        return res.status(500).json({ message: "Unable to fetch categories" });
    }
};
exports.getCategoriesAdmin = getCategoriesAdmin;
const createCategory = async (req, res) => {
    const { name, image } = req.body;
    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
    }
    try {
        const id = await (0, firestore_1.allocateId)("categories");
        await (0, firestore_1.collection)("categories").doc((0, firestore_1.documentId)(id)).create({
            id,
            name: name.trim(),
            image: typeof image === "string" ? image : "",
            created_at: new Date(),
        });
        return res.status(201).json({ message: "Category created", id });
    }
    catch (error) {
        console.error("Admin create category error", error);
        return res.status(500).json({ message: "Unable to create category" });
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    const categoryId = numericId(typeof req.params.categoryId === "string" ? req.params.categoryId : "");
    const { name, image } = req.body;
    if (!categoryId)
        return res.status(400).json({ message: "Invalid category ID" });
    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
    }
    try {
        const categoryRef = (0, firestore_1.collection)("categories").doc((0, firestore_1.documentId)(categoryId));
        const category = await categoryRef.get();
        if (!category.exists)
            return res.status(404).json({ message: "Category not found" });
        await categoryRef.update({
            name: name.trim(),
            image: typeof image === "string" ? image : category.data()?.image || "",
        });
        return res.json({ message: "Category updated" });
    }
    catch (error) {
        console.error("Admin update category error", error);
        return res.status(500).json({ message: "Unable to update category" });
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    const categoryId = numericId(typeof req.params.categoryId === "string" ? req.params.categoryId : "");
    if (!categoryId)
        return res.status(400).json({ message: "Invalid category ID" });
    try {
        const categoryRef = (0, firestore_1.collection)("categories").doc((0, firestore_1.documentId)(categoryId));
        const category = await categoryRef.get();
        if (!category.exists)
            return res.status(404).json({ message: "Category not found" });
        await categoryRef.delete();
        return res.json({ message: "Category deleted" });
    }
    catch (error) {
        console.error("Admin delete category error", error);
        return res.status(500).json({ message: "Unable to delete category" });
    }
};
exports.deleteCategory = deleteCategory;
const getAdminCustomers = async (_req, res) => {
    try {
        const [users, orders] = await Promise.all([
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("users").where("role", "==", "customer")),
            (0, firestore_1.listDocuments)((0, firestore_1.collection)("orders")),
        ]);
        const totals = new Map();
        orders.forEach((order) => {
            const userId = Number(order.user_id);
            const total = totals.get(userId) || { orderCount: 0, lifetimeValue: 0 };
            total.orderCount += 1;
            total.lifetimeValue += Number(order.total) || 0;
            totals.set(userId, total);
        });
        const customers = users
            .map((user) => ({
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            created_at: user.created_at,
            orderCount: totals.get(Number(user.id))?.orderCount || 0,
            lifetimeValue: totals.get(Number(user.id))?.lifetimeValue || 0,
        }))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return res.json(customers);
    }
    catch (error) {
        console.error("Admin get customers error", error);
        return res.status(500).json({ message: "Unable to fetch customers" });
    }
};
exports.getAdminCustomers = getAdminCustomers;
//# sourceMappingURL=adminController.js.map