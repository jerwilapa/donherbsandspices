import { Request, Response } from "express";
import { db } from "../config/db";

/* ========================
   ADD TO CART
======================== */
export const addToCart = async (req: Request, res: Response) => {
  const { userId, productId, quantity = 1 } = req.body;

  try {
    const [productRows]: any = await db.query(
      "SELECT stock FROM products WHERE id = ?",
      [productId],
    );
    const product = productRows[0];

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 1. get or create cart
    let [cart]: any = await db.query("SELECT * FROM cart WHERE user_id = ?", [
      userId,
    ]);

    if (cart.length === 0) {
      const [result]: any = await db.query(
        "INSERT INTO cart (user_id) VALUES (?)",
        [userId],
      );

      cart = [{ id: result.insertId }];
    }

    const cartId = cart[0].id;

    // 2. check existing item
    const [existing]: any = await db.query(
      "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cartId, productId],
    );

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: "Cannot add more than available stock",
        });
      }

      await db.query(
        "UPDATE cart_items SET quantity = ? WHERE id = ?",
        [newQuantity, existing[0].id],
      );
    } else {
      if (quantity > product.stock) {
        return res.status(400).json({
          message: "Cannot add more than available stock",
        });
      }

      await db.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
        [cartId, productId, quantity],
      );
    }

    res.json({ message: "Added to cart" });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getCart = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const [cart]: any = await db.query("SELECT * FROM cart WHERE user_id = ?", [
      userId,
    ]);

    if (cart.length === 0) {
      return res.json([]);
    }

    const cartId = cart[0].id;

    const [items]: any = await db.query(
      `
            SELECT 
                ci.id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image,
                p.stock
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = ?
        `,
      [cartId],
    );

    res.json(items);
  } catch (err) {
    res.status(500).json(err);
  }
};
export const updateCartItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const [rows]: any = await db.query(
      `SELECT ci.id, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const stock = rows[0].stock;

    if (quantity > stock) {
      return res.status(400).json({
        message: "Quantity exceeds available stock",
      });
    }

    if (quantity <= 0) {
      await db.query("DELETE FROM cart_items WHERE id = ?", [id]);
    } else {
      await db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [
        quantity,
        id,
      ]);
    }

    res.json({ message: "Cart updated" });
  } catch (err) {
    res.status(500).json(err);
  }
};
export const removeCartItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM cart_items WHERE id = ?", [id]);

    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json(err);
  }
};

export const getCartCount = async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const [rows]: any = await db.query(
      `
            SELECT SUM(quantity) as count
            FROM cart_items ci
            JOIN cart c ON c.id = ci.cart_id
            WHERE c.user_id = ?
            `,
      [userId],
    );

    res.json({ count: rows[0].count || 0 });
  } catch (err) {
    res.status(500).json(err);
  }
};
