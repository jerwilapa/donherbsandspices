"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartCount = exports.removeCartItem = exports.updateCartItem = exports.getCart = exports.addToCart = void 0;
const db_1 = require("../config/db");
const firestore_1 = require("../utils/firestore");
const productImage_1 = require("../utils/productImage");
const getUserCart = async (userId) => {
    const carts = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("cart").where("user_id", "==", userId).limit(1));
    return carts[0] || null;
};
const addToCart = async (req, res) => {
    const userId = req.user?.id;
    const { productId, quantity = 1 } = req.body;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(Number(productId)) ||
        Number(productId) <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0) {
        return res.status(400).json({ message: "Product and positive quantity are required." });
    }
    try {
        const productRef = (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(productId));
        await db_1.db.runTransaction(async (transaction) => {
            const productSnapshot = await transaction.get(productRef);
            const product = (0, firestore_1.snapshotData)(productSnapshot);
            if (!product)
                throw new Error("PRODUCT_NOT_FOUND");
            const cartQuery = (0, firestore_1.collection)("cart").where("user_id", "==", userId).limit(1);
            const cartQuerySnapshot = await transaction.get(cartQuery);
            let cart = cartQuerySnapshot.docs[0]
                ? (0, firestore_1.snapshotData)(cartQuerySnapshot.docs[0])
                : null;
            let cartRef = cartQuerySnapshot.docs[0]?.ref;
            let newCartId = 0;
            if (!cart) {
                const counterRef = (0, firestore_1.collection)("_counters").doc("cart");
                const counterSnapshot = await transaction.get(counterRef);
                newCartId = Number(counterSnapshot.data()?.value || 0) + 1;
                cartRef = (0, firestore_1.collection)("cart").doc((0, firestore_1.documentId)(newCartId));
                cart = { id: newCartId, user_id: userId, created_at: new Date() };
            }
            const cartId = Number(cart.id);
            const itemQuery = (0, firestore_1.collection)("cart_items").where("cart_id", "==", cartId);
            const itemSnapshot = await transaction.get(itemQuery);
            const existingSnapshot = itemSnapshot.docs.find((snapshot) => Number(snapshot.data().product_id) === Number(productId));
            const existing = existingSnapshot ? (0, firestore_1.snapshotData)(existingSnapshot) : null;
            const newQuantity = Number(existing?.quantity || 0) + quantity;
            if (newQuantity > Number(product.stock))
                throw new Error("STOCK_LIMIT");
            let newItemId = 0;
            let itemRef = existingSnapshot?.ref;
            if (!existing) {
                const counterRef = (0, firestore_1.collection)("_counters").doc("cart_items");
                const counterSnapshot = await transaction.get(counterRef);
                newItemId = Number(counterSnapshot.data()?.value || 0) + 1;
                itemRef = (0, firestore_1.collection)("cart_items").doc((0, firestore_1.documentId)(newItemId));
            }
            if (!cartQuerySnapshot.docs.length) {
                transaction.set((0, firestore_1.collection)("_counters").doc("cart"), { value: newCartId });
                transaction.create(cartRef, cart);
            }
            if (!existing) {
                transaction.set((0, firestore_1.collection)("_counters").doc("cart_items"), { value: newItemId });
                transaction.create(itemRef, {
                    id: newItemId,
                    cart_id: cartId,
                    product_id: Number(productId),
                    quantity,
                });
            }
            else {
                transaction.update(itemRef, { quantity: newQuantity });
            }
        });
        return res.json({ message: "Added to cart" });
    }
    catch (error) {
        if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({ message: "Product not found" });
        }
        if (error instanceof Error && error.message === "STOCK_LIMIT") {
            return res.status(400).json({ message: "Cannot add more than available stock" });
        }
        console.error("Add to cart error", error);
        return res.status(500).json({ message: "Unable to update cart" });
    }
};
exports.addToCart = addToCart;
const getCart = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const cart = await getUserCart(userId);
        if (!cart)
            return res.json([]);
        const items = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("cart_items").where("cart_id", "==", Number(cart.id)));
        if (!items.length)
            return res.json([]);
        const productSnapshots = await db_1.db.getAll(...items.map((item) => (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(item.product_id))));
        const products = new Map(productSnapshots
            .map((snapshot) => (0, firestore_1.snapshotData)(snapshot))
            .filter((product) => product !== null)
            .map((product) => [Number(product.id), product]));
        return res.json(items.flatMap((item) => {
            const product = products.get(Number(item.product_id));
            return product
                ? [{
                        id: item.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        name: product.name,
                        price: product.price,
                        image: (0, productImage_1.resolveProductImage)(product.name, product.image),
                        stock: product.stock,
                    }]
                : [];
        }));
    }
    catch (error) {
        console.error("Get cart error", error);
        return res.status(500).json({ message: "Unable to retrieve cart" });
    }
};
exports.getCart = getCart;
const updateCartItem = async (req, res) => {
    const userId = req.user?.id;
    const id = typeof req.params.id === "string" ? req.params.id : "";
    const { quantity } = req.body;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(Number(id)) || Number(id) <= 0 ||
        !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "A positive whole-number quantity is required." });
    }
    try {
        const itemRef = (0, firestore_1.collection)("cart_items").doc((0, firestore_1.documentId)(id));
        await db_1.db.runTransaction(async (transaction) => {
            const itemSnapshot = await transaction.get(itemRef);
            const item = (0, firestore_1.snapshotData)(itemSnapshot);
            if (!item)
                throw new Error("CART_ITEM_NOT_FOUND");
            const cartRef = (0, firestore_1.collection)("cart").doc((0, firestore_1.documentId)(item.cart_id));
            const productRef = (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(item.product_id));
            const [cartSnapshot, productSnapshot] = await Promise.all([
                transaction.get(cartRef),
                transaction.get(productRef),
            ]);
            const cart = (0, firestore_1.snapshotData)(cartSnapshot);
            const product = (0, firestore_1.snapshotData)(productSnapshot);
            if (!cart || Number(cart.user_id) !== userId)
                throw new Error("CART_ITEM_NOT_FOUND");
            if (!product)
                throw new Error("PRODUCT_NOT_FOUND");
            if (quantity > Number(product.stock))
                throw new Error("STOCK_LIMIT");
            transaction.update(itemRef, { quantity });
        });
        return res.json({ message: "Cart updated" });
    }
    catch (error) {
        if (error instanceof Error && error.message === "CART_ITEM_NOT_FOUND") {
            return res.status(404).json({ message: "Cart item not found" });
        }
        if (error instanceof Error && error.message === "STOCK_LIMIT") {
            return res.status(400).json({ message: "Quantity exceeds available stock" });
        }
        console.error("Update cart item error", error);
        return res.status(500).json({ message: "Unable to update cart item" });
    }
};
exports.updateCartItem = updateCartItem;
const removeCartItem = async (req, res) => {
    const userId = req.user?.id;
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const itemRef = (0, firestore_1.collection)("cart_items").doc((0, firestore_1.documentId)(id));
        await db_1.db.runTransaction(async (transaction) => {
            const itemSnapshot = await transaction.get(itemRef);
            const item = (0, firestore_1.snapshotData)(itemSnapshot);
            if (!item)
                return;
            const cartSnapshot = await transaction.get((0, firestore_1.collection)("cart").doc((0, firestore_1.documentId)(item.cart_id)));
            const cart = (0, firestore_1.snapshotData)(cartSnapshot);
            if (!cart || Number(cart.user_id) !== userId)
                throw new Error("CART_ITEM_NOT_FOUND");
            transaction.delete(itemRef);
        });
        return res.json({ message: "Item removed" });
    }
    catch (error) {
        if (error instanceof Error && error.message === "CART_ITEM_NOT_FOUND") {
            return res.status(404).json({ message: "Cart item not found" });
        }
        console.error("Remove cart item error", error);
        return res.status(500).json({ message: "Unable to remove cart item" });
    }
};
exports.removeCartItem = removeCartItem;
const getCartCount = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const cart = await getUserCart(userId);
        if (!cart)
            return res.json({ count: 0 });
        const items = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("cart_items").where("cart_id", "==", Number(cart.id)));
        return res.json({
            count: items.reduce((total, item) => total + Number(item.quantity || 0), 0),
        });
    }
    catch (error) {
        console.error("Get cart count error", error);
        return res.status(500).json({ message: "Unable to retrieve cart count" });
    }
};
exports.getCartCount = getCartCount;
//# sourceMappingURL=cartController.js.map