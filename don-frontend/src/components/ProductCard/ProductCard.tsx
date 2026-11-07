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
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import {
    MdFavorite as FavoriteIcon,
    MdFavoriteBorder as FavoriteBorderIcon,
    MdVisibility as VisibilityIcon,
    MdShoppingCart as ShoppingCartIcon,
} from "react-icons/md";

import { useEffect, useState } from "react";

type ProductVariant = {
    productId: number;
    size: string;
    price: number;
    image: string;
    stock: number;
    cartQuantity?: number;
    isFavorite?: boolean;
};

type Props = {
    name: string;
    variants: ProductVariant[];
    onToggleFavorite?: (id: number) => Promise<void>;
    onAddToCart: (id: number) => Promise<void> | void;
};

const ProductCard = ({
    name,
    variants,
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
    const [selectedProductId, setSelectedProductId] = useState(variants[0]?.productId);
    const selectedVariant =
        variants.find((variant) => variant.productId === selectedProductId) ?? variants[0];
    const favorite = selectedVariant?.isFavorite ?? false;
    const [open, setOpen] = useState(false);
    const handleQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setOpen(true);
    };
    useEffect(() => {
        if (!variants.some((variant) => variant.productId === selectedProductId)) {
            setSelectedProductId(variants[0]?.productId);
        }
    }, [selectedProductId, variants]);
    if (!selectedVariant) return null;

    const availableStock = Math.max(
        selectedVariant.stock - (selectedVariant.cartQuantity || 0),
        0,
    );
    const handleAdd = async () => {
        if (availableStock <= 0) {
            setSnackbar({
                open: true,
                message: "No stock available after existing cart quantity.",
                severity: "error",
            });
            return;
        }

        try {
            setLoading(true);

            await onAddToCart(selectedVariant.productId);

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
            await onToggleFavorite?.(selectedVariant.productId);

            setSnackbar({
                open: true,
                message: favorite
                    ? "Removed from favorites"
                    : "Added to favorites",
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
                        src={selectedVariant.image}
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
                        ₱{Number(selectedVariant.price).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
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
                                <FavoriteIcon size={20} />
                            ) : (
                                <FavoriteBorderIcon size={20} />
                            )}
                        </IconButton>

                        <IconButton
                            size="small"
                            onClick={handleQuickView}
                            sx={{ bgcolor: "#fff" }}
                        >
                            <VisibilityIcon size={20} />
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

                    {variants.length > 1 && (
                        <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                            <InputLabel id={`size-label-${selectedVariant.productId}`}>Size</InputLabel>
                            <Select
                                labelId={`size-label-${selectedVariant.productId}`}
                                value={selectedVariant.productId}
                                label="Size"
                                onChange={(event) => setSelectedProductId(Number(event.target.value))}
                            >
                                {variants.map((variant) => (
                                    <MenuItem key={variant.productId} value={variant.productId}>
                                        {variant.size}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 1,
                            color: availableStock > 0 ? "success.main" : "error.main",
                            fontWeight: 600,
                        }}
                    >
                        {availableStock > 0
                            ? `${availableStock} left${selectedVariant.cartQuantity ? ` · ${selectedVariant.cartQuantity} in cart` : ""}`
                            : "Out of stock"}
                    </Typography>
                </CardContent>

                {/* ACTION */}
                <Box sx={{ p: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCartIcon size={20} />}
                        onClick={handleAdd}
                        disabled={
                            loading ||
                            availableStock <= 0
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
                        {availableStock <= 0
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
                    <img src={selectedVariant.image} width="100%" alt={name} />
                    <Typography>{selectedVariant.size}</Typography>
                    <Typography>
                        ₱{Number(selectedVariant.price).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Typography>
                </Box>
            </Dialog>
        </>
    );
};

export default ProductCard;