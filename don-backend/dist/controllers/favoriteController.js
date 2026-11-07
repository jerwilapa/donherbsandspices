"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavoritesByUser = exports.toggleFavorite = void 0;
const db_1 = require("../config/db");
const firestore_1 = require("../utils/firestore");
const toggleFavorite = async (req, res) => {
    const userId = req.user?.id;
    const { productId } = req.body;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (!Number.isInteger(Number(productId)) || Number(productId) <= 0) {
        return res.status(400).json({ message: "A valid product ID is required." });
    }
    try {
        const favoriteId = `${userId}_${Number(productId)}`;
        const favoriteRef = (0, firestore_1.collection)("favorites").doc(favoriteId);
        const isFavorite = await db_1.db.runTransaction(async (transaction) => {
            const productRef = (0, firestore_1.collection)("products").doc((0, firestore_1.documentId)(productId));
            const [productSnapshot, favoriteSnapshot] = await Promise.all([
                transaction.get(productRef),
                transaction.get(favoriteRef),
            ]);
            if (!productSnapshot.exists)
                throw new Error("PRODUCT_NOT_FOUND");
            if (favoriteSnapshot.exists) {
                transaction.delete(favoriteRef);
                return false;
            }
            transaction.create(favoriteRef, {
                user_id: userId,
                product_id: Number(productId),
                created_at: new Date(),
            });
            return true;
        });
        return res.json({
            success: true,
            favorite: isFavorite,
            message: isFavorite ? "Added to favorites" : "Removed from favorites",
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
            return res.status(404).json({ message: "Product not found" });
        }
        console.error("Toggle favorite error", error);
        return res.status(500).json({ success: false, message: "Unable to update favorites" });
    }
};
exports.toggleFavorite = toggleFavorite;
const getFavoritesByUser = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const favorites = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("favorites").where("user_id", "==", userId));
        return res.json(favorites.map(({ product_id }) => ({ product_id })));
    }
    catch (error) {
        console.error("Get favorites error", error);
        return res.status(500).json({ message: "Unable to retrieve favorites" });
    }
};
exports.getFavoritesByUser = getFavoritesByUser;
//# sourceMappingURL=favoriteController.js.map