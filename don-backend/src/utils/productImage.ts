import fs from "fs";
import path from "path";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const productNameAliases: Record<string, string> = {
  "cinnamon sticks broken": "cinnamon sticks",
  "sesame seeds white": "sesame seeds",
  "szhechuan pepper powder": "szhechuan pepper",
  "szhechuan pepper whole": "szhechuan pepper",
};

let imageIndex: Map<string, string> | undefined;

const normalize = (value: string) =>
  value
    .replace(/^\d+-\d+-/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();

const getImageIndex = () => {
  if (imageIndex) return imageIndex;

  const productsPath = path.resolve(process.cwd(), "uploads", "products");
  const optimizedPath = path.join(productsPath, "optimized");
  const index = new Map<string, string>();

  const directories: Array<[string, string]> = [
    [optimizedPath, "/uploads/products/optimized"],
    [productsPath, "/uploads/products"],
  ];
  for (const [directory, urlPrefix] of directories) {
    if (!fs.existsSync(directory)) continue;
    for (const filename of fs.readdirSync(directory)) {
      if (!imageExtensions.has(path.extname(filename).toLowerCase())) continue;
      const key = normalize(filename);
      if (!index.has(key)) {
        index.set(key, `${urlPrefix}/${encodeURIComponent(filename)}`);
      }
    }
  }

  imageIndex = index;
  return imageIndex;
};

export const resolveProductImage = (
  productName: string,
  currentImage?: string | null,
): string => {
  if (typeof currentImage === "string" && currentImage.trim()) return currentImage;

  const normalizedName = normalize(
    productName.replace(/\s*(?:-|–|—)?\s*(?:1\s?kg|500\s?g)$/i, ""),
  );
  const key = productNameAliases[normalizedName] || normalizedName;
  return getImageIndex().get(key) || "";
};
