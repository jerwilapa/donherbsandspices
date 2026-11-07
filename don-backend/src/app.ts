import express from "express";
import cors from "cors";
import path from "path";

import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import addressRoutes from "./routes/addressRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";

const app = express();

/* ========================
   MIDDLEWARE
======================== */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

/* ========================
   STATIC FILES
======================== */
const uploadsPath = path.resolve(process.cwd(), "uploads");

app.use("/uploads", express.static(uploadsPath, { maxAge: "1d" }));

/* ========================
   ROUTES
======================== */
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/favorites", favoriteRoutes);
/* ========================
   DEBUG (optional)
======================== */
app.get("/debug-upload", (req, res) => {
  res.sendFile(path.join(uploadsPath, "categories/basicspices.jpg"));
});

export default app;
