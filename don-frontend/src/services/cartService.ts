import { api } from "./api";

/* ========================
   ADD TO CART
======================== */
export const addToCart = (productId: number, quantity = 1) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return api.post("/cart/add", {
    userId: user.id,
    productId,
    quantity,
  });
};

/* ========================
   GET CART
======================== */
export const getCart = () => {
  return api.get("/cart");
};

/* ========================
   UPDATE ITEM QTY
======================== */
export const updateCartItem = (id: number, quantity: number) => {
  return api.put(`/cart/item/${id}`, {
    quantity,
  });
};

/* ========================
   REMOVE ITEM
======================== */
export const removeCartItem = (id: number) => {
  return api.delete(`/cart/item/${id}`);
};
