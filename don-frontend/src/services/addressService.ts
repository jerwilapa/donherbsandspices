import axios from "../api/axios";
import { api } from "./api";

export const getSavedAddress = () => api.get("/addresses");

export const saveAddress = (data: any) => {
  const { userId: _userId, ...address } = data;
  return api.post("/addresses", address);
};

export const setDefaultAddress = (addressId: number) => {
  return axios.post("/addresses/set-default", {
    addressId,
  });
};
