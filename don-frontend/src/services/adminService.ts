import { api } from "./api";

export const getAdminOrders = async () => {
  const res = await api.get("/admin/orders");
  return res.data;
};

export const getAdminOrderDetails = async (orderId: number) => {
  const res = await api.get(`/admin/orders/${orderId}`);
  return res.data;
};

export const getAdminCustomers = async () => {
  const res = await api.get("/admin/customers");
  return res.data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
  const res = await api.put(`/admin/orders/${orderId}/status`, { status });
  return res.data;
};

export const getAdminProducts = async () => {
  const res = await api.get("/admin/products");
  return res.data;
};

export const createProduct = async (payload: any) => {
  const res = await api.post("/admin/products", payload);
  return res.data;
};

export const updateProduct = async (productId: number, payload: any) => {
  const res = await api.put(`/admin/products/${productId}`, payload);
  return res.data;
};

export const deleteProduct = async (productId: number) => {
  const res = await api.delete(`/admin/products/${productId}`);
  return res.data;
};

export const getAdminCategories = async () => {
  const res = await api.get("/admin/categories");
  return res.data;
};

export const createCategory = async (payload: any) => {
  const res = await api.post("/admin/categories", payload);
  return res.data;
};

export const updateCategory = async (categoryId: number, payload: any) => {
  const res = await api.put(`/admin/categories/${categoryId}`, payload);
  return res.data;
};

export const deleteCategory = async (categoryId: number) => {
  const res = await api.delete(`/admin/categories/${categoryId}`);
  return res.data;
};
