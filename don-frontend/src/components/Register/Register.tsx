import { useState } from "react";
import {
    Box,
    Card,
    Typography,
    TextField,
    Button,
    Divider,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios"; // <-- your axios instance
import { showToast } from "../../helper/showToast";

const Register = () => {
    const navigate = useNavigate();

    const [fullname, setFullname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullname || !email || !password || !confirmPassword) {
            showToast("error", "Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            showToast("error", "Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            await api.post("/auth/register", {
                fullname,
                email,
                password,
            });


            showToast("success", "Registration successful");

            navigate("/login");
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Registration failed.");
        } finally {
            setLoading(false);
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

                <Typography
                    sx={{
                        textAlign: "center",
                        color: "#666",
                        mb: 3,
                    }}
                >
                    Create your account
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <TextField
                        label="Full Name"
                        fullWidth
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                    />

                    <TextField
                        label="Email"
                        type="email"
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

                    <TextField
                        label="Confirm Password"
                        type="password"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                    />

                    <Button
                        variant="contained"
                        onClick={handleRegister}
                        disabled={loading}
                        sx={{
                            backgroundColor: "#111",
                            textTransform: "none",
                            py: 1.2,
                            borderRadius: 2,
                            "&:hover": {
                                backgroundColor: "#333",
                            },
                        }}
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    <Typography
                        sx={{
                            textAlign: "center",
                            fontSize: 14,
                            color: "#666",
                        }}
                    >
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            style={{
                                color: "#111",
                                fontWeight: 600,
                                textDecoration: "none",
                            }}
                        >
                            Login
                        </Link>
                    </Typography>
                </Box>
            </Card>
        </Box>
    );
};

export default Register;