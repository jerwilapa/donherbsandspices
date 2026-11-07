"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = void 0;
const firestore_1 = require("../utils/firestore");
const getCategories = async (_req, res) => {
    try {
        const categories = await (0, firestore_1.listDocuments)((0, firestore_1.collection)("categories"));
        return res.json(categories.sort((a, b) => Number(a.id) - Number(b.id)));
    }
    catch (error) {
        console.error("Fetch categories error", error);
        return res.status(500).json({ message: "Error fetching categories" });
    }
};
exports.getCategories = getCategories;
//# sourceMappingURL=categoryController.js.map