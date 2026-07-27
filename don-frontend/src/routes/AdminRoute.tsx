import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
        return <Navigate to="/login" replace />;
    }

    let user;
    try {
        user = JSON.parse(storedUser);
    } catch {
        return <Navigate to="/" replace />;
    }

    if (user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
