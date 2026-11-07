"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addressController_1 = require("../controllers/addressController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get("/", authMiddleware_1.verifyToken, addressController_1.getSavedAddress);
router.post("/", authMiddleware_1.verifyToken, addressController_1.saveAddress);
router.post("/set-default", authMiddleware_1.verifyToken, addressController_1.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=addressRoutes.js.map