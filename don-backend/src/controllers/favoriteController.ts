import { Request, Response } from "express";
import { db } from "../config/db";

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    const [existing]: any = await db.query(
      `
            SELECT id
            FROM favorites
            WHERE user_id = ?
            AND product_id = ?
            `,
      [userId, productId],
    );

    if (existing.length > 0) {
      await db.query(
        `
                DELETE FROM favorites
                WHERE user_id = ?
                AND product_id = ?
                `,
        [userId, productId],
      );

      return res.json({
        success: true,
        favorite: false,
        message: "Removed from favorites",
      });
    }

    await db.query(
      `
            INSERT INTO favorites (user_id, product_id)
            VALUES (?, ?)
            `,
      [userId, productId],
    );

    return res.json({
      success: true,
      favorite: true,
      message: "Added to favorites",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getFavoritesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [rows]: any = await db.query(
      `
            SELECT product_id
            FROM favorites
            WHERE user_id = ?
            `,
      [userId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
