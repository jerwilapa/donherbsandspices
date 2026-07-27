import { Request, Response } from "express";
import { db } from "../config/db";

// GET ALL PRODUCTS (with category name)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(`
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
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    const [rows] = await db.query(
      `
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
      `,
      [categoryId],
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error filtering products" });
  }
};
