import {
    Button,
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Snackbar,
    Alert,
    Dialog,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import { useEffect, useState } from "react";

type Props = {
    productId: number;
    name: string;
    price: number;
    image: string;
    stock?: number;
    cartQuantity?: number;
    isFavorite?: boolean;
    onToggleFavorite?: (id: number) => Promise<void>;
    onAddToCart: (id: number) => Promise<void> | void;
};

const ProductCard = ({
    productId,
    name,
    price,
    image,
    stock,
    cartQuantity,
    isFavorite,
    onToggleFavorite,
    onAddToCart,
}: Props) => {
    const [hover, setHover] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [favorite, setFavorite] = useState(isFavorite || false);
    const [open, setOpen] = useState(false);
    const handleQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setOpen(true);
    };
    const availableStock =
        stock !== undefined ? Math.max(stock - (cartQuantity || 0), 0) : undefined;
    useEffect(() => {
        setFavorite(isFavorite || false);
    }, [isFavorite]);
    const handleAdd = async () => {
        if (availableStock !== undefined && availableStock <= 0) {
            setSnackbar({
                open: true,
                message: "No stock available after existing cart quantity.",
                severity: "error",
            });
            return;
        }

        try {
            setLoading(true);

            await onAddToCart(productId);

            setSnackbar({
                open: true,
                message: "Added to cart!",
                severity: "success",
            });
        } catch (err: any) {
            setSnackbar({
                open: true,
                message:
                    err?.response?.data?.message || "Unable to add to cart.",
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };
    const handleFavorite = async (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.stopPropagation();

        try {
            await onToggleFavorite?.(productId);

            setFavorite((prev) => !prev);

            setSnackbar({
                open: true,
                message: !favorite
                    ? "Added to favorites"
                    : "Removed from favorites",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Unable to update favorites",
                severity: "error",
            });
        }
    };
    return (
        <>
            <Card
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    transition: "transform 0.25s ease, opacity 0.25s ease",
                    willChange: "transform, opacity",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
                    },
                }}
            >
                {/* IMAGE */}
                <Box
                    sx={{
                        position: "relative",
                        overflow: "hidden",
                        width: "100%",
                        aspectRatio: "4 / 3",
                        minHeight: 220,
                    }}
                >
                    <Box
                        component="img"
                        src={image}
                        alt={name}
                        sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.35s ease",
                            willChange: "transform",
                            transform: hover ? "scale(1.08)" : "scale(1)",
                            display: "block",
                        }}
                    />

                    {/* PRICE */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 12,
                            left: 12,
                            bgcolor: "rgba(0,0,0,0.75)",
                            color: "#fff",
                            px: 1.5,
                            py: 0.6,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: 14,
                        }}
                    >
                        ₱{price}
                    </Box>

                    {/* QUICK ACTIONS */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            opacity: hover ? 1 : 0,
                            transform: hover ? "translateY(0)" : "translateY(-10px)",
                            transition: "transform 0.25s ease, opacity 0.25s ease",
                            willChange: "transform, opacity",
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={handleFavorite}
                            sx={{
                                bgcolor: "#fff",
                                color: favorite ? "#e91e63" : "#555",
                                "&:hover": {
                                    bgcolor: "#fff",
                                    color: "#e91e63",
                                },
                            }}
                        >
                            {favorite ? (
                                <FavoriteIcon fontSize="small" />
                            ) : (
                                <FavoriteBorderIcon fontSize="small" />
                            )}
                        </IconButton>

                        <IconButton
                            size="small"
                            onClick={handleQuickView}
                            sx={{ bgcolor: "#fff" }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* CONTENT */}
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: 48,
                        }}
                    >
                        {name}
                    </Typography>

                    {stock !== undefined && (
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 1,
                                color:
                                    availableStock !== undefined && availableStock > 0
                                        ? "success.main"
                                        : "error.main",
                                fontWeight: 600,
                            }}
                        >
                            {availableStock !== undefined
                                ? availableStock > 0
                                    ? `${availableStock} left${cartQuantity ? ` · ${cartQuantity} in cart` : ""}`
                                    : "Out of stock"
                                : `${stock} in stock`}
                        </Typography>
                    )}
                </CardContent>

                {/* ACTION */}
                <Box sx={{ p: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCartIcon />}
                        onClick={handleAdd}
                        disabled={
                            loading ||
                            (availableStock !== undefined && availableStock <= 0)
                        }
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            borderRadius: 2,
                            "&:hover": {
                                transform: "scale(1.02)",
                                backgroundColor: "#333",
                            },
                        }}
                    >
                        {availableStock !== undefined && availableStock <= 0
                            ? "Out of Stock"
                            : loading
                                ? "Adding..."
                                : "Add to Cart"}
                    </Button>
                </Box>
            </Card>


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
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
                <Box p={3}>
                    <Typography variant="h6">{name}</Typography>
                    <img src={image} width="100%" />
                    <Typography>₱{price}</Typography>
                </Box>
            </Dialog>
        </>
    );
};

export default ProductCard;