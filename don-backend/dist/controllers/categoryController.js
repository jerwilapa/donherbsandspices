"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = void 0;
const db_1 = require("../config/db");
const getCategories = async (req, res) => {
    try {
        const [rows] = await db_1.db.query("SELECT * FROM categories");
        res.json(rows);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching categories" });
    }
};
exports.getCategories = getCategories;
//# sourceMappingURL=categoryController.js.map