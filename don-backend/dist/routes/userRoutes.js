"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const db_1 = require("../config/db");
const router = express_1.default.Router();
router.get("/me", authMiddleware_1.verifyToken, async (req, res) => {
    try {
        const [rows] = await db_1.db.query("SELECT id, fullname, email, role FROM users WHERE id = ?", [req.user.id]);
        if (!rows.length) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({
            user: rows[0],
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map