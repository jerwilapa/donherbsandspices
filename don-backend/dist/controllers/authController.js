"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const jwt_1 = require("../utils/jwt");
/* ========================
   REGISTER
======================== */
const registerUser = async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
        const [existing] = await db_1.db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await db_1.db.query("INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)", [fullname, email, hashedPassword, "customer"]);
        return res.status(200).json({
            message: "User registered successfully",
        });
    }
    catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : error,
        });
    }
};
exports.registerUser = registerUser;
/* ========================
   LOGIN
======================== */
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db_1.db.query("SELECT * FROM users WHERE email = ?", [
            email,
        ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = rows[0];
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = (0, jwt_1.generateToken)(user);
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(500).json(error);
    }
};
exports.loginUser = loginUser;
const getUser = async (req, res) => {
    const { id } = req.params;
    const [rows] = await db_1.db.query("SELECT id, fullname, email, role FROM users WHERE id = ?", [id]);
    if (!rows.length) {
        return res.status(404).json({ message: "User not found" });
    }
    res.json(rows[0]);
};
exports.getUser = getUser;
//# sourceMappingURL=authController.js.map