import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export const useCart = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/cart/count");
      setCount(res.data.count);
    } catch (err) {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    window.addEventListener("cartUpdated", fetchCount);
    window.addEventListener("auth-change", fetchCount);
    return () => {
      window.removeEventListener("cartUpdated", fetchCount);
      window.removeEventListener("auth-change", fetchCount);
    };
  }, [fetchCount]);

  return {
    count,
    loading,
    refreshCart: fetchCount,
  };
};
