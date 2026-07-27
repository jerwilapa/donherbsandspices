import { api } from "./api";

export const toggleFavorite = async (userId: number, productId: number) => {
  const { data } = await api.post("/favorites/toggle", {
    userId,
    productId,
  });

  return data;
};
