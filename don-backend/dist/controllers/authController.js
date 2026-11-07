"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFcmToken = exports.getUser = exports.loginUser = exports.registerUser = void 0;
const crypto_1 = require("crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const firestore_1 = require("../utils/firestore");
const jwt_1 = require("../utils/jwt");
const emailIndexId = (email) => (0, crypto_1.createHash)("sha256").update(email).digest("hex");
const registerUser = async (req, res) => {
    const { fullname, email, password } = req.body;
    if (typeof fullname !== "string" ||
        !fullname.trim() ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128) {
        return res.status(400).json({
            message: "Provide a name, valid email, and password between 12 and 128 characters.",
        });
    }
    const normalizedEmail = email.trim().toLowerCase();
    try {
        const userId = await (0, firestore_1.allocateId)("users");
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const userRef = (0, firestore_1.collection)("users").doc((0, firestore_1.documentId)(userId));
        const emailRef = (0, firestore_1.collection)("userEmailIndex").doc(emailIndexId(normalizedEmail));
        await db_1.db.runTransaction(async (transaction) => {
            const emailIndex = await transaction.get(emailRef);
            if (emailIndex.exists)
                throw new Error("EMAIL_ALREADY_EXISTS");
            const matches = await transaction.get((0, firestore_1.collection)("users").where("email", "==", normalizedEmail).limit(1));
            if (!matches.empty)
                throw new Error("EMAIL_ALREADY_EXISTS");
            const user = {
                id: userId,
                fullname: fullname.trim(),
                email: normalizedEmail,
                password: passwordHash,
                role: "customer",
                fcm_token: null,
                created_at: new Date(),
            };
            transaction.create(userRef, user);
            transaction.create(emailRef, { user_id: userId });
        });
        return res.status(200).json({ message: "User registered successfully" });
    }
    catch (error) {
        if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
            return res.status(400).json({ message: "Email already exists" });
        }
        console.error("Register error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        const users = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("users").where("email", "==", email.trim().toLowerCase()).limit(1));
        const user = users[0];
        if (!user || typeof user.password !== "string" || !(await bcrypt_1.default.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (user.role !== "admin" && user.role !== "customer") {
            return res.status(403).json({ message: "Account role is invalid." });
        }
        const token = (0, jwt_1.generateToken)({
            id: Number(user.id),
            email: user.email,
            role: user.role,
        });
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: Number(user.id),
                fullname: user.fullname,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error", error);
        return res.status(500).json({ message: "Unable to log in." });
    }
};
exports.loginUser = loginUser;
const getUser = async (req, res) => {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id)
        return res.status(400).json({ message: "Invalid user ID" });
    if (!req.user || (req.user.id !== Number(id) && req.user.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        const user = await (0, firestore_1.getDocument)("users", id);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json({
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        console.error("Get user error", error);
        return res.status(500).json({ message: "Unable to retrieve account" });
    }
};
exports.getUser = getUser;
const saveFcmToken = async (req, res) => {
    const token = req.body?.token;
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (typeof token !== "string" || !token.trim()) {
        return res.status(400).json({ message: "FCM token is required" });
    }
    try {
        const userRef = (0, firestore_1.collection)("users").doc((0, firestore_1.documentId)(userId));
        const user = await userRef.get();
        if (!user.exists)
            return res.status(404).json({ message: "User not found" });
        await userRef.update({ fcm_token: token.trim() });
        return res.json({ message: "FCM token saved" });
    }
    catch (error) {
        console.error("Save FCM token error", error);
        return res.status(500).json({ message: "Unable to save FCM token" });
    }
};
exports.saveFcmToken = saveFcmToken;
//# sourceMappingURL=authController.js.map