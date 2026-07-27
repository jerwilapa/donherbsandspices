import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
} from "@mui/material";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Badge from "@mui/material/Badge";
import { useCart } from "../../hooks/useCart";

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const isAdmin = user?.role === "admin";
    const { count } = useCart();

    useEffect(() => {
        const syncUser = () => {
            try {
                const storedUser = localStorage.getItem("user");
                setUser(storedUser ? JSON.parse(storedUser) : null);
            } catch {
                setUser(null);
            }
        };

        syncUser(); // run once on mount

        window.addEventListener("auth-change", syncUser);

        return () => {
            window.removeEventListener("auth-change", syncUser);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.dispatchEvent(new Event("auth-change"));
        navigate("/login");
    };
    useEffect(() => {
        console.log("USER STATE:", user);
    }, [user]);
    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                zIndex: 1000,
                backgroundColor: "#fff",
                borderBottom: "1px solid #e5e5e5",
                color: "#111",
            }}
        >
            <Toolbar
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* LOGO */}
                <Typography
                    component={Link}
                    to="/"
                    sx={{
                        fontFamily: '"Imprint MT Shadow", serif',
                        fontWeight: 400,
                        letterSpacing: 1.5,
                        color: "#111",
                        textDecoration: "none",
                        fontSize: { xs: 22, md: 28 },
                    }}
                >
                    DON'
                </Typography>

                {/* NAV LINKS */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    {!isAdmin && (
                        <>
                            <Button
                                component={Link}
                                to="/"
                                sx={{
                                    color: "#111",
                                    textTransform: "none",
                                    fontWeight: 500,
                                }}
                            >
                                Home
                            </Button>

                            <Button
                                component={Link}
                                to="/products"
                                sx={{
                                    color: "#111",
                                    textTransform: "none",
                                    fontWeight: 500,
                                }}
                            >
                                Products
                            </Button>
                            <Button
                                component={Link}
                                to="/orders"
                                sx={{
                                    color: "#111",
                                    textTransform: "none",
                                    fontWeight: 500,
                                }}
                            >
                                Orders
                            </Button>
                        </>
                    )}
                    {user?.role === "admin" && (
                        <Button
                            component={Link}
                            to="/admin"
                            sx={{
                                color: "#111",
                                textTransform: "none",
                                fontWeight: 500,
                            }}
                        >
                            Dashboard
                        </Button>
                    )}
                    {!isAdmin && (
                        <IconButton component={Link} to="/cart">
                            <Badge badgeContent={count} color="error">
                                <ShoppingCartIcon />
                            </Badge>
                        </IconButton>
                    )}
                    {/* AUTH SECTION */}
                    {user ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: "#333",
                                    px: 1,
                                }}
                            >
                                Hi, {user?.fullname || "User"}
                            </Typography>

                            <Button
                                onClick={handleLogout}
                                startIcon={<LogoutIcon />}
                                sx={{
                                    borderColor: "#111",
                                    color: "#111",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderRadius: "999px",
                                    px: 2,
                                    transition: "all 0.25s ease",
                                    "&:hover": {
                                        backgroundColor: "#111",
                                        color: "#fff",
                                        borderColor: "#111",
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                                    },
                                    "&:active": {
                                        transform: "scale(0.96)",
                                    },
                                }}
                            >
                                Logout
                            </Button>
                        </Box>
                    ) : (
                        <Button
                            component={Link}
                            to="/login"
                            startIcon={<LoginIcon />}
                            sx={{
                                borderColor: "#111",
                                color: "#111",
                                textTransform: "none",
                                fontWeight: 500,
                                borderRadius: "999px",
                                px: 2,
                                transition: "transform 0.2s ease, background-color 0.25s ease, color 0.25s ease",
                                willChange: "transform, background-color, color",
                                "&:hover": {
                                    backgroundColor: "#111",
                                    color: "#fff",
                                    borderColor: "#111",
                                    transform: "translateY(-2px)",
                                    /* do not animate box-shadow to avoid layout jank */
                                    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                                },
                                "&:active": {
                                    transform: "scale(0.96)",
                                },
                            }}
                        >
                            Login
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;