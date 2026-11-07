"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../utils/jwt");
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) {
        return res.status(401).json({ message: "A valid bearer token is required" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, jwt_1.getJwtSecret)());
        if (typeof decoded === "string" ||
            typeof decoded.id !== "number" ||
            !Number.isInteger(decoded.id) ||
            (decoded.role !== "admin" && decoded.role !== "customer") ||
            typeof decoded.email !== "string") {
            return res.status(403).json({ message: "Invalid token" });
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch {
        return res.status(403).json({ message: "Invalid token" });
    }
};
exports.verifyToken = verifyToken;
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};
exports.verifyAdmin = verifyAdmin;
//# sourceMappingURL=authMiddleware.js.map