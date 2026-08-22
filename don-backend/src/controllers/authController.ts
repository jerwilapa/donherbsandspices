import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "../config/db";
import { generateToken } from "../utils/jwt";

/* ========================
   REGISTER
======================== */
export const registerUser = async (req: Request, res: Response) => {
  const { fullname, email, password } = req.body;

  try {
    const [existing]: any = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)",
      [fullname, email, hashedPassword, "customer"],
    );

    return res.status(200).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : error,
    });
  }
};

/* ========================
   LOGIN
======================== */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  const [rows]: any = await db.query(
    "SELECT id, fullname, email, role FROM users WHERE id = ?",
    [id],
  );

  if (!rows.length) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(rows[0]);
};

export const saveFcmToken = async (req: any, res: Response) => {
  const { token } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!token) {
    return res.status(400).json({ message: "FCM token is required" });
  }

  try {
    const [columns]: any = await db.query(
      "SHOW COLUMNS FROM users LIKE 'fcm_token'",
    );

    if (!columns.length) {
      return res.status(400).json({
        message: "FCM is not configured for this database yet.",
      });
    }

    await db.query("UPDATE users SET fcm_token = ? WHERE id = ?", [
      token,
      userId,
    ]);

    return res.json({ message: "FCM token saved" });
  } catch (error) {
    console.error("SAVE FCM TOKEN ERROR:", error);
    return res.status(500).json({
      message: "Unable to save FCM token",
      error: error instanceof Error ? error.message : error,
    });
  }
};
