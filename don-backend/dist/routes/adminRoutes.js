"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminController_1 = require("../controllers/adminController");
const multer_1 = require("../config/multer");
const bulkPriceUpdateController_1 = require("../controllers/bulkPriceUpdateController");
const router = express_1.default.Router();
router.use(authMiddleware_1.verifyToken, authMiddleware_1.verifyAdmin);
router.get("/orders", adminController_1.getOrdersAdmin);
router.get("/orders/:orderId", adminController_1.getAdminOrderDetails);
router.get("/customers", adminController_1.getAdminCustomers);
router.put("/orders/:orderId/status", adminController_1.updateOrderStatus);
/* CREATE */
router.post("/products", multer_1.uploadProductImage.single("image"), adminController_1.createProduct);
/* UPDATE */
router.put("/products/:productId", multer_1.uploadProductImage.single("image"), adminController_1.updateProduct);
/* DELETE */
router.delete("/products/:productId", adminController_1.deleteProduct);
/* GET */
router.get("/products", adminController_1.getProductsAdmin);
router.put("/products/prices/bulk", bulkPriceUpdateController_1.bulkUpdateProductPrices);
router.get("/categories", adminController_1.getCategoriesAdmin);
router.post("/categories", adminController_1.createCategory);
router.put("/categories/:categoryId", adminController_1.updateCategory);
router.delete("/categories/:categoryId", adminController_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map