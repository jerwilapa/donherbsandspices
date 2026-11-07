"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByCategory = exports.getProducts = void 0;
const firestore_1 = require("../utils/firestore");
const productImage_1 = require("../utils/productImage");
const productsWithCategory = async (categoryId) => {
    const productQuery = categoryId
        ? (0, firestore_1.collection)("products").where("category_id", "==", Number(categoryId))
        : (0, firestore_1.collection)("products");
    const [products, categories] = await Promise.all([
        (0, firestore_1.listDocuments)(productQuery),
        (0, firestore_1.listDocuments)((0, firestore_1.collection)("categories")),
    ]);
    const categoryNames = new Map(categories.map((category) => [Number(category.id), category.name]));
    return products
        .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: (0, productImage_1.resolveProductImage)(product.name, product.image),
        category: categoryNames.get(Number(product.category_id)) || null,
        category_id: product.category_id,
        stock: product.stock,
    }))
        .sort((a, b) => Number(b.id) - Number(a.id));
};
const getProducts = async (_req, res) => {
    try {
        return res.json(await productsWithCategory());
    }
    catch (error) {
        console.error("Fetch products error", error);
        return res.status(500).json({ message: "Error fetching products" });
    }
};
exports.getProducts = getProducts;
const getProductsByCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.categoryId);
        if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({ message: "A valid category ID is required." });
        }
        return res.json(await productsWithCategory(String(categoryId)));
    }
    catch (error) {
        console.error("Filter products error", error);
        return res.status(500).json({ message: "Error filtering products" });
    }
};
exports.getProductsByCategory = getProductsByCategory;
//# sourceMappingURL=productController.js.map