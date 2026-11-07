import { Request, Response } from "express";
import { collection, listDocuments } from "../utils/firestore";

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await listDocuments(collection("categories"));
    return res.json(categories.sort((a, b) => Number(a.id) - Number(b.id)));
  } catch (error) {
    console.error("Fetch categories error", error);
    return res.status(500).json({ message: "Error fetching categories" });
  }
};
