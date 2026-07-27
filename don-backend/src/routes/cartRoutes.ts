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
router.get("/:userId", getCart);
router.put("/item/:id", updateCartItem);
router.delete("/item/:id", removeCartItem);

export default router;
