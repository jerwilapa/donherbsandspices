"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavoritesByUser = exports.toggleFavorite = void 0;
const db_1 = require("../config/db");
const toggleFavorite = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const [existing] = await db_1.db.query(`
            SELECT id
            FROM favorites
            WHERE user_id = ?
            AND product_id = ?
            `, [userId, productId]);
        if (existing.length > 0) {
            await db_1.db.query(`
                DELETE FROM favorites
                WHERE user_id = ?
                AND product_id = ?
                `, [userId, productId]);
            return res.json({
                success: true,
                favorite: false,
                message: "Removed from favorites",
            });
        }
        await db_1.db.query(`
            INSERT INTO favorites (user_id, product_id)
            VALUES (?, ?)
            `, [userId, productId]);
        return res.json({
            success: true,
            favorite: true,
            message: "Added to favorites",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
exports.toggleFavorite = toggleFavorite;
const getFavoritesByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await db_1.db.query(`
            SELECT product_id
            FROM favorites
            WHERE user_id = ?
            `, [userId]);
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getFavoritesByUser = getFavoritesByUser;
//# sourceMappingURL=favoriteController.js.map