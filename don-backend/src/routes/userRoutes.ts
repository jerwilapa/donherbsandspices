import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import { db } from "../config/db";
import { saveFcmToken } from "../controllers/authController";

const router = express.Router();

router.get("/me", verifyToken, async (req: any, res) => {
  try {
    const [rows]: any = await db.query(
      "SELECT id, fullname, email, role FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/me/fcm-token", verifyToken, saveFcmToken);

export default router;
