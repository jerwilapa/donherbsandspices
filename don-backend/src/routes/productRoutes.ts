import express from "express";
import {
  getProducts,
  getProductsByCategory,
} from "../controllers/productController";

const router = express.Router();

router.get("/", getProducts);
router.get("/category/:categoryId", getProductsByCategory);

export default router;
