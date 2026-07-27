import { API_URL } from "../../config/env";

export const getImageUrl = (path?: string) => {
  if (!path) return "/placeholder.jpg";

  // already absolute URL safety check
  if (path.startsWith("http")) return path;

  return `${API_URL}${path}`;
};
