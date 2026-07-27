import express from "express";
import { placeOrder, getOrders } from "../controllers/orderController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", verifyToken, getOrders);
router.post("/", verifyToken, placeOrder);

export default router;
