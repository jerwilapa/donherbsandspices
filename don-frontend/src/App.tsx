import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { requestFirebasePermission, listenForForegroundMessages } from "./firebase";
import { showToast } from "./helper/showToast";
import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import Orders from "./pages/Orders/Orders";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminCategories from "./pages/Admin/AdminCategories";
import AdminCustomers from "./pages/Admin/AdminCustomers";
import AdminLayout from "./pages/Admin/AdminLayout";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import api from "./api/axios";
import Layout from "./pages/layoutFooter";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";

function App() {

  useEffect(() => {
    const loadUser = async () => {
      if (!localStorage.getItem("token")) {
        localStorage.removeItem("user");
        return;
      }

      try {
        const res = await api.get("/users/me");

        console.log("LOGGED IN USER:", res.data.user);

        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (typeof window !== "undefined" && "Notification" in window) {
          const token = await requestFirebasePermission();

          if (token) {
            try {
              await api.post("/users/me/fcm-token", { token });
            } catch (saveErr) {
              console.warn("Unable to save FCM token", saveErr);
            }
          }
        }
      } catch (err) {
        console.log("No valid session");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const unsubscribe = listenForForegroundMessages((payload) => {
      const title = payload?.notification?.title || "DON notification";
      const body = payload?.notification?.body || "You have a new update.";
      showToast("success", `${title}: ${body}`);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={
          <Layout>
            <Home />
          </Layout>
        } />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Layout>
                <Cart />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Layout>
                <Checkout />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;