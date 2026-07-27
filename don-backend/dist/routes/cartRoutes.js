"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cartController_1 = require("../controllers/cartController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/add", authMiddleware_1.verifyToken, cartController_1.addToCart);
router.get("/count", authMiddleware_1.verifyToken, cartController_1.getCartCount);
router.get("/:userId", cartController_1.getCart);
router.put("/item/:id", cartController_1.updateCartItem);
router.delete("/item/:id", cartController_1.removeCartItem);
exports.default = router;
//# sourceMappingURL=cartRoutes.js.map