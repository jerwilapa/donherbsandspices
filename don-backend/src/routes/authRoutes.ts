import express from "express";
import {
  registerUser,
  loginUser,
  getUser,
} from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/users/:id", getUser);
export default router;
