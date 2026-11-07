"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const firestore_1 = require("../utils/firestore");
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.get("/me", authMiddleware_1.verifyToken, async (req, res) => {
    try {
        const user = await (0, firestore_1.getDocument)("users", req.user.id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json({
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Get current user error", error);
        return res.status(500).json({ message: "Unable to retrieve account" });
    }
});
router.post("/me/fcm-token", authMiddleware_1.verifyToken, authController_1.saveFcmToken);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map