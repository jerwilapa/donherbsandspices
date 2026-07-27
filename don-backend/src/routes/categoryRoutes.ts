import express from "express";
import { getCategories } from "../controllers/categoryController";

const router = express.Router();

// THIS becomes /api/categories
router.get("/", getCategories);

export default router;
