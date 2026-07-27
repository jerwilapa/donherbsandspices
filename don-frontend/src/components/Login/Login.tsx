import { useState } from "react";
import axios from "axios";
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Divider,
} from "@mui/material";
import { API_URL } from "../../../config/env";
import { Link, useNavigate } from "react-router-dom";
import { showToast } from "../../helper/showToast";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
    id: number;
    email: string;
    role: string;
    iat: number;
    exp: number;
};

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const res = await axios.post(
                `${API_URL}/api/auth/login`,
                { email, password }
            );

            const { token } = res.data;

            // 1. store token
            localStorage.setItem("token", token);

            // 2. decode token (ONLY for ID)
            const tokenUser = jwtDecode<TokenPayload>(token);

            // 3. fetch FULL user from DB (IMPORTANT FIX)
            const userRes = await axios.get(
                `${API_URL}/api/auth/users/${tokenUser.id}`
            );

            const fullUser = userRes.data;

            // 4. store FULL user
            localStorage.setItem("user", JSON.stringify(fullUser));

            window.dispatchEvent(new Event("auth-change"));

            await showToast("success", "Login successful");

            if (fullUser?.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/");
            }

        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Login failed");
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f7f7f7",
                px: 2,
                py: 3,
            }}
        >
            <Card
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: 3,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >
                {/* BRAND */}
                <Typography
                    component={Link}
                    to="/"
                    sx={{
                        display: "block",
                        textAlign: "center",
                        fontFamily: '"Imprint MT Shadow", serif',
                        fontSize: { xs: 22, sm: 28 },
                        textDecoration: "none",
                        color: "#111",
                        mb: 1,
                    }}
                >
                    DON'
                </Typography>

                {/* SUBTITLE */}
                <Typography
                    sx={{
                        textAlign: "center",
                        color: "#666",
                        fontSize: 14,
                        mb: 3,
                    }}
                >
                    Login to your account
                </Typography>

                {/* FORM */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        variant="contained"
                        onClick={handleLogin}
                        sx={{
                            backgroundColor: "#111",
                            textTransform: "none",
                            py: 1.2,
                            borderRadius: 2,
                            fontWeight: 500,
                            "&:hover": {
                                backgroundColor: "#333",
                            },
                        }}
                    >
                        Login
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    <Typography
                        sx={{
                            textAlign: "center",
                            fontSize: 14,
                            color: "#666",
                        }}
                    >
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            style={{
                                color: "#111",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            Register
                        </Link>
                    </Typography>
                </Box>
            </Card>
        </Box>
    );
};

export default Login;