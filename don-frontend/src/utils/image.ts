import type { SyntheticEvent } from "react";
import { API_URL } from "../../config/env";

export const PLACEHOLDER_IMAGE_URL = "/placeholder.svg";

export const getImageUrl = (path?: string) => {
  if (!path?.trim()) return PLACEHOLDER_IMAGE_URL;

  if (/^https?:\/\//i.test(path)) return path;

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = PLACEHOLDER_IMAGE_URL;
};
