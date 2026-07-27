import { Request, Response } from "express";
import { db } from "../config/db";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories" });
  }
};
