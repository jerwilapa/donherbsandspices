"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authRateLimit_1 = require("../middleware/authRateLimit");
const router = express_1.default.Router();
router.post("/register", authRateLimit_1.authRateLimit, authController_1.registerUser);
router.post("/login", authRateLimit_1.authRateLimit, authController_1.loginUser);
router.get("/users/:id", authMiddleware_1.verifyToken, authController_1.getUser);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map