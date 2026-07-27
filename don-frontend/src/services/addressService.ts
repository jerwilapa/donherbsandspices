import axios from "../api/axios";
import { api } from "./api";

export const getSavedAddress = (userId: number) =>
  api.get(`/addresses/${userId}`);

export const saveAddress = (data: any) => api.post("/addresses", data);

export const setDefaultAddress = (userId: number, addressId: number) => {
  return axios.post("/addresses/set-default", {
    userId,
    addressId,
  });
};
