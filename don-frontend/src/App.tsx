import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import Orders from "./pages/Orders/Orders";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminCategories from "./pages/Admin/AdminCategories";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import api from "./api/axios";
import Layout from "./pages/layoutFooter";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";

function App() {

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/users/me");

        console.log("LOGGED IN USER:", res.data.user);

        // optional: store fresh user data
        localStorage.setItem("user", JSON.stringify(res.data.user));

      } catch (err) {
        console.log("No valid session");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    loadUser();
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
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <Layout>
                <AdminOrders />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <Layout>
                <AdminProducts />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <Layout>
                <AdminCategories />
              </Layout>
            </AdminRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;