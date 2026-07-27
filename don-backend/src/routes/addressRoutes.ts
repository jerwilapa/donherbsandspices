import { Router } from "express";
import {
  getSavedAddress,
  saveAddress,
  setDefaultAddress,
} from "../controllers/addressController";

const router = Router();

router.get("/:userId", getSavedAddress);
router.post("/", saveAddress);
router.post("/set-default", setDefaultAddress);
export default router;
