import express from "express";
import {
  getFavoritesByUser,
  toggleFavorite,
} from "../controllers/favoriteController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/toggle", verifyToken, toggleFavorite);
router.get("/", verifyToken, getFavoritesByUser);

export default router;
