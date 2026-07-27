import multer from "multer";
import path from "path";
import fs from "fs";

/* ensure folder exists */
const uploadPath = path.join(process.cwd(), "uploads/products");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/* storage config */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

/* file filter */
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WEBP are allowed"));
  }

  cb(null, true);
};

export const uploadProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
