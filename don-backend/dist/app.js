"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
/* ========================
   MIDDLEWARE
======================== */
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
/* ========================
   STATIC FILES
======================== */
const uploadsPath = path_1.default.resolve(process.cwd(), "uploads");
app.use("/uploads", express_1.default.static(uploadsPath));
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
/* ========================
   DEBUG (optional)
======================== */
app.get("/debug-upload", (req, res) => {
    res.sendFile(path_1.default.join(uploadsPath, "categories/basicspices.jpg"));
});
exports.default = app;
//# sourceMappingURL=app.js.map