import { useEffect, useState } from "react";
import {
    Container,
    Typography,
    Box,
    Button,
    Paper,
    Grid,
    Stack,
    IconButton,
    Divider,
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { useNavigate } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem } from "../../services/cartService";
import Navbar from "../../components/Navbar/NavBar";
import { getImageUrl } from "../../utils/image";

const Cart = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    const formatPrice = (value: number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
        }).format(value);

    const loadCart = async () => {
        if (!user?.id) {
            setCart([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await getCart(user.id);
            setCart(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, [user?.id]);

    const handleUpdate = async (id: number, qty: number, stock?: number) => {
        if (qty < 1) return;

        if (stock !== undefined && qty > stock) {
            setSnackbar({
                open: true,
                message: "Quantity exceeds available stock",
                severity: "error",
            });
            return;
        }

        setUpdatingId(id);

        try {
            await updateCartItem(id, qty);
            await loadCart();
            window.dispatchEvent(new Event("cartUpdated"));
            setSnackbar({
                open: true,
                message: "Cart updated successfully",
                severity: "success",
            });
        } catch (err: any) {
            setSnackbar({
                open: true,
                message:
                    err?.response?.data?.message || "Unable to update quantity",
                severity: "error",
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemove = async (id: number) => {
        setRemovingId(id);

        try {
            await removeCartItem(id);
            await loadCart();
            window.dispatchEvent(new Event("cartUpdated"));
            setSnackbar({
                open: true,
                message: "Item removed from cart",
                severity: "success",
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: "Unable to remove item",
                severity: "error",
            });
        } finally {
            setRemovingId(null);
        }
    };
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const shipping = cart.length ? 120 : 0;
    const total = subtotal + shipping;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <>
            <Navbar />

            <Container sx={{ py: 6, minHeight: "calc(100vh - 220px)" }}>
                <Typography variant="h4" fontWeight={700} mb={1}>
                    Shopping Cart
                </Typography>
                <Typography color="text.secondary" mb={4}>
                    {cart.length > 0
                        ? `You have ${itemCount} item${itemCount === 1 ? "" : "s"} in your bag.`
                        : "Your cart is currently empty. Add products to continue."
                    }
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={8}>
                        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, minHeight: 440 }}>
                            {loading ? (
                                <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
                                    <CircularProgress />
                                </Box>
                            ) : cart.length === 0 ? (
                                <Box sx={{ textAlign: "center", py: 8 }}>
                                    <Typography variant="h6" mb={2}>
                                        Your cart is empty
                                    </Typography>
                                    <Typography color="text.secondary" mb={3}>
                                        Browse products and add your favorites to get started.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => navigate("/products")}
                                        sx={{ textTransform: "none" }}
                                    >
                                        Continue shopping
                                    </Button>
                                </Box>
                            ) : (
                                <Stack spacing={3}>
                                    {cart.map((item) => (
                                        <Paper
                                            key={item.id}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                display: "flex",
                                                flexDirection: { xs: "column", sm: "row" },
                                                gap: 2,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                sx={{
                                                    width: 120,
                                                    height: 120,
                                                    borderRadius: 3,
                                                    objectFit: "cover",
                                                    flexShrink: 0,
                                                }}
                                            />

                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight={700}
                                                    noWrap
                                                >
                                                    {item.name}
                                                </Typography>
                                                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {formatPrice(item.price)} each
                                                </Typography>
                                                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                                    Subtotal: {formatPrice(item.price * item.quantity)}
                                                </Typography>

                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                                                    <IconButton
                                                        type="button"
                                                        size="small"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            handleUpdate(item.id, item.quantity - 1);
                                                        }}
                                                        disabled={item.quantity <= 1 || updatingId === item.id}
                                                    >
                                                        <RemoveIcon fontSize="small" />
                                                    </IconButton>
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            textAlign: "center",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {item.quantity}
                                                    </Box>
                                                    <IconButton
                                                        type="button"
                                                        size="small"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            handleUpdate(item.id, item.quantity + 1, item.stock);
                                                        }}
                                                        disabled={
                                                            updatingId === item.id ||
                                                            (item.stock !== undefined && item.quantity >= item.stock)
                                                        }
                                                    >
                                                        <AddIcon fontSize="small" />
                                                    </IconButton>
                                                    <Button
                                                        type="button"
                                                        color="error"
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            handleRemove(item.id);
                                                        }}
                                                        disabled={removingId === item.id}
                                                        sx={{ textTransform: "none" }}
                                                    >
                                                        {removingId === item.id ? "Removing" : "Remove"}
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 3, position: "sticky", top: 24 }}>
                            <Typography variant="h6" fontWeight={700} mb={2}>
                                Order summary
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography>{formatPrice(subtotal)}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Typography color="text.secondary">Shipping</Typography>
                                    <Typography>{shipping ? formatPrice(shipping) : "Free"}</Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                                    <Typography>Total</Typography>
                                    <Typography>{formatPrice(total)}</Typography>
                                </Box>
                            </Stack>

                            <Button
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, textTransform: "none" }}
                                disabled={cart.length === 0}
                                onClick={() => navigate("/checkout")}
                            >
                                Proceed to checkout
                            </Button>
                            <Button
                                fullWidth
                                variant="text"
                                sx={{ mt: 1, textTransform: "none" }}
                                onClick={() => navigate("/products")}
                            >
                                Continue shopping
                            </Button>

                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 3,
                                    color: "text.secondary",
                                }}
                            >
                                <LocalShippingIcon fontSize="small" />
                                <Typography variant="body2">
                                    Fast shipping and easy returns.
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={2500}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                        severity={snackbar.severity}
                        sx={{ width: "100%" }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
};

export default Cart;
