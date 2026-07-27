import { api } from "./api";

export const fetchCategories = async () => {
  const res = await api.get("/categories");
  return res.data;
};

export const fetchProducts = async () => {
  const res = await api.get("/products");
  return res.data;
};
