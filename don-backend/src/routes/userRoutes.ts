import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import { getDocument } from "../utils/firestore";
import { saveFcmToken } from "../controllers/authController";

const router = express.Router();

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await getDocument("users", req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get current user error", error);
    return res.status(500).json({ message: "Unable to retrieve account" });
  }
});

router.post("/me/fcm-token", verifyToken, saveFcmToken);

export default router;
