"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImage = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/* ensure folder exists */
const uploadPath = path_1.default.join(process.cwd(), "uploads/products");
if (!fs_1.default.existsSync(uploadPath)) {
    fs_1.default.mkdirSync(uploadPath, { recursive: true });
}
/* storage config */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const safeName = file.originalname
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9.-]/g, "");
        cb(null, `${uniqueSuffix}-${safeName}`);
    },
});
/* file filter */
const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only JPG, PNG, and WEBP are allowed"));
    }
    cb(null, true);
};
exports.uploadProductImage = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});
//# sourceMappingURL=multer.js.map