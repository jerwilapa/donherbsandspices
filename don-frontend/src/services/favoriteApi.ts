import { api } from "./api";

export const toggleFavorite = async (productId: number) => {
  const { data } = await api.post("/favorites/toggle", {
    productId,
  });

  return data;
};
