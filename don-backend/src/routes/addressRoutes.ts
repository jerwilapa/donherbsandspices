import { Router } from "express";
import {
  getSavedAddress,
  saveAddress,
  setDefaultAddress,
} from "../controllers/addressController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, getSavedAddress);
router.post("/", verifyToken, saveAddress);
router.post("/set-default", verifyToken, setDefaultAddress);
export default router;
