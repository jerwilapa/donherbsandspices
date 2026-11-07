import express from "express";
import {
  registerUser,
  loginUser,
  getUser,
} from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";
import { authRateLimit } from "../middleware/authRateLimit";

const router = express.Router();

router.post("/register", authRateLimit, registerUser);
router.post("/login", authRateLimit, loginUser);

router.get("/users/:id", verifyToken, getUser);
export default router;
