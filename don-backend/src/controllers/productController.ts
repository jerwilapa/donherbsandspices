import { Request, Response } from "express";
import { collection, listDocuments } from "../utils/firestore";
import { resolveProductImage } from "../utils/productImage";

const productsWithCategory = async (categoryId?: string) => {
  const productQuery = categoryId
    ? collection("products").where("category_id", "==", Number(categoryId))
    : collection("products");
  const [products, categories] = await Promise.all([
    listDocuments(productQuery),
    listDocuments(collection("categories")),
  ]);
  const categoryNames = new Map(
    categories.map((category) => [Number(category.id), category.name]),
  );
  return products
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolveProductImage(product.name, product.image),
      category: categoryNames.get(Number(product.category_id)) || null,
      category_id: product.category_id,
      stock: product.stock,
    }))
    .sort((a, b) => Number(b.id) - Number(a.id));
};

export const getProducts = async (_req: Request, res: Response) => {
  try {
    return res.json(await productsWithCategory());
  } catch (error) {
    console.error("Fetch products error", error);
    return res.status(500).json({ message: "Error fetching products" });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = Number(req.params.categoryId);
    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "A valid category ID is required." });
    }
    return res.json(await productsWithCategory(String(categoryId)));
  } catch (error) {
    console.error("Filter products error", error);
    return res.status(500).json({ message: "Error filtering products" });
  }
};
