import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
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
dotenv.config();

app.use(helmet());

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
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error(`Invalid production CORS origin: ${origin}`);
    }

    if (parsedOrigin.protocol !== "https:" || parsedOrigin.origin !== origin) {
      throw new Error(`Production CORS origins must be HTTPS origins: ${origin}`);
    }
  }
}

app.use(
  cors({
    origin: configuredOrigins?.length
      ? configuredOrigins
      : ["http://localhost:5173"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

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

export default app;
