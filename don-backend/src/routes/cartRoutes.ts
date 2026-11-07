import express from "express";
import {
  addToCart,
  getCart,
  getCartCount,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/add", verifyToken, addToCart);
router.get("/count", verifyToken, getCartCount);
router.get("/", verifyToken, getCart);
router.put("/item/:id", verifyToken, updateCartItem);
router.delete("/item/:id", verifyToken, removeCartItem);

export default router;
