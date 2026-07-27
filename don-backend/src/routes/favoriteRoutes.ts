import express from "express";
import {
  getFavoritesByUser,
  toggleFavorite,
} from "../controllers/favoriteController";

const router = express.Router();

router.post("/toggle", toggleFavorite);
router.get("/:userId", getFavoritesByUser);

export default router;
