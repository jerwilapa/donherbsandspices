"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByCategory = exports.getProducts = void 0;
const db_1 = require("../config/db");
// GET ALL PRODUCTS (with category name)
const getProducts = async (req, res) => {
    try {
        const [rows] = await db_1.db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        c.name AS category,
        p.category_id,
        p.stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching products" });
    }
};
exports.getProducts = getProducts;
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const [rows] = await db_1.db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        p.stock,
        c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.id DESC
      `, [categoryId]);
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: "Error filtering products" });
    }
};
exports.getProductsByCategory = getProductsByCategory;
//# sourceMappingURL=productController.js.map