import { api } from "./api";

export const placeOrder = async (payload: any) => {
  const res = await api.post(`/orders`, payload);
  return res.data;
};

export const getOrders = async () => {
  const res = await api.get(`/orders`);
  return res.data;
};

export default { placeOrder, getOrders };
