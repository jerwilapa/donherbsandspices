"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const addressRoutes_1 = __importDefault(require("./routes/addressRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use((0, helmet_1.default)());
const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
if (isProduction && !configuredOrigins?.length) {
    throw new Error("CORS_ORIGINS must contain at least one production frontend origin.");
}
if (isProduction) {
    for (const origin of configuredOrigins || []) {
        let parsedOrigin;
        try {
            parsedOrigin = new URL(origin);
        }
        catch {
            throw new Error(`Invalid production CORS origin: ${origin}`);
        }
        if (parsedOrigin.protocol !== "https:" || parsedOrigin.origin !== origin) {
            throw new Error(`Production CORS origins must be HTTPS origins: ${origin}`);
        }
    }
}
app.use((0, cors_1.default)({
    origin: configuredOrigins?.length
        ? configuredOrigins
        : ["http://localhost:5173"],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
/* ========================
   STATIC FILES
======================== */
const uploadsPath = path_1.default.resolve(process.cwd(), "uploads");
app.use("/uploads", express_1.default.static(uploadsPath, { maxAge: "1d" }));
/* ========================
   ROUTES
======================== */
app.use("/api/auth", authRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/products", productRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/cart", cartRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/admin", adminRoutes_1.default);
app.use("/api/addresses", addressRoutes_1.default);
app.use("/api/favorites", favoriteRoutes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map