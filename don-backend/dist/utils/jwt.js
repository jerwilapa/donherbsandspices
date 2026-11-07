"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.getJwtSecret = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || /^(replace|change|your)[-_ ]/i.test(secret)) {
        throw new Error("JWT_SECRET must be configured with at least 32 characters.");
    }
    return secret;
};
exports.getJwtSecret = getJwtSecret;
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
    }, (0, exports.getJwtSecret)(), { expiresIn: "1d" });
};
exports.generateToken = generateToken;
//# sourceMappingURL=jwt.js.map