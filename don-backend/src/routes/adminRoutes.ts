import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware";
import {
  getOrdersAdmin,
  getAdminOrderDetails,
  updateOrderStatus,
  getProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategoriesAdmin,
  getAdminCustomers,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/adminController";
import { uploadProductImage } from "../config/multer";

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get("/orders", getOrdersAdmin);
router.get("/orders/:orderId", getAdminOrderDetails);
router.get("/customers", getAdminCustomers);
router.put("/orders/:orderId/status", updateOrderStatus);

/* CREATE */
router.post("/products", uploadProductImage.single("image"), createProduct);

/* UPDATE */
router.put(
  "/products/:productId",
  uploadProductImage.single("image"),
  updateProduct,
);

/* DELETE */
router.delete("/products/:productId", deleteProduct);

/* GET */
router.get("/products", getProductsAdmin);

router.get("/categories", getCategoriesAdmin);
router.post("/categories", createCategory);
router.put("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

export default router;
