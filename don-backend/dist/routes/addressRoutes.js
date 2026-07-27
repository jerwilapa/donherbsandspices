"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const addressController_1 = require("../controllers/addressController");
const router = (0, express_1.Router)();
router.get("/:userId", addressController_1.getSavedAddress);
router.post("/", addressController_1.saveAddress);
router.post("/set-default", addressController_1.setDefaultAddress);
exports.default = router;
//# sourceMappingURL=addressRoutes.js.map