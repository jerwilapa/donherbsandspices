import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Container,
    Typography,
    Chip,
    TextField,
    Skeleton,
} from "@mui/material";

import Navbar from "../../components/Navbar/NavBar";
import ProductCard from "../../components/ProductCard/ProductCard";
import { api } from "../../services/api";
import { useSearchParams } from "react-router-dom";
import { getImageUrl } from "../../utils/image";
import { addToCart, getCart } from "../../services/cartService";
import { toggleFavorite } from "../../services/favoriteApi";
import { groupCatalogProducts } from "../../utils/productCatalog";

type Product = {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    category_id: number;
    stock: number;
};

type Category = {
    id: number;
    name: string;
};

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [cartItems, setCartItems] = useState<{ product_id: number; quantity: number }[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const [favorites, setFavorites] = useState<number[]>([]);
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                if (!user?.id) return;

                const res = await api.get("/favorites");

                setFavorites(res.data.map((f: any) => f.product_id));
            } catch (err) {
                console.error("Failed to load favorites", err);
            }
        };

        loadFavorites();
    }, []);
    const selectedCategory = searchParams.get("category")
        ? Number(searchParams.get("category"))
        : null;

    useEffect(() => {
        loadProducts();
        loadCategories();
        loadCartItems();
    }, []);

    const loadProducts = async () => {
        try {
            setLoadingProducts(true);
            const res = await api.get("/products");
            setProducts(res.data);
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);
            const res = await api.get("/categories");
            setCategories(res.data);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadCartItems = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (!user?.id) {
                setCartItems([]);
                return;
            }
            const res = await getCart();
            setCartItems(
                res.data.map((item: any) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
            );
        } catch (err) {
            setCartItems([]);
        }
    };

    const catalogProducts = useMemo(() => groupCatalogProducts(products), [products]);
    const filteredProducts = catalogProducts.filter((product) => {
        const categoryMatch = selectedCategory === null ||
            product.variants.some(({ product: variant }) => variant.category_id === selectedCategory);
        const searchMatch = product.name.toLowerCase().includes(search.toLowerCase());
        return categoryMatch && searchMatch;
    });
    const handleAddToCart = async (productId: number) => {
        await addToCart(productId, 1);
        window.dispatchEvent(new Event("cartUpdated"));
        await loadCartItems();
    };
    const handleToggleFavorite = async (productId: number) => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!user?.id) return;

        try {
            const res = await toggleFavorite(productId);

            // 🔥 UPDATE UI STATE immediately
            setFavorites((prev) =>
                res.favorite
                    ? [...prev, productId]
                    : prev.filter((id) => id !== productId)
            );
        } catch (err) {
            console.error("Favorite failed", err);
        }
    };
    return (
        <>
            <Navbar />

            <Container sx={{ py: 5 }}>
                <Typography variant="h4" fontWeight="bold" mb={4}>
                    Products
                </Typography>

                <TextField
                    fullWidth
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mb: 3 }}
                />

                {/* CATEGORY FILTERS */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 4 }}>
                    {loadingCategories
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="rounded"
                                width={80}
                                height={32}
                                sx={{ borderRadius: 5 }}
                            />
                        ))
                        : (
                            <>
                                <Chip
                                    label="All"
                                    clickable
                                    color={selectedCategory === null ? "primary" : "default"}
                                    onClick={() => setSearchParams({})}
                                />

                                {categories.map((cat) => (
                                    <Chip
                                        key={cat.id}
                                        label={cat.name}
                                        clickable
                                        color={
                                            selectedCategory === cat.id
                                                ? "primary"
                                                : "default"
                                        }
                                        onClick={() =>
                                            setSearchParams({ category: String(cat.id) })
                                        }
                                    />
                                ))}
                            </>
                        )}
                </Box>

                {/* PRODUCTS GRID */}
                <Box
                    sx={{
                        display: "grid",
                        gap: 3,
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2,1fr)",
                            md: "repeat(3,1fr)",
                            lg: "repeat(4,1fr)",
                        },
                        gridAutoRows: "1fr",
                        alignItems: "stretch",
                    }}
                >
                    {loadingProducts
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                variant="rounded"
                                height={320}
                                animation="wave"
                            />
                        ))
                        : filteredProducts.map((group) => (
                            <ProductCard
                                key={`${group.variants[0]?.product.category_id ?? ""}:${group.name}`}
                                name={group.name}
                                variants={group.variants.map(({ product, size }) => ({
                                    productId: product.id,
                                    size,
                                    price: Number(product.price),
                                    image: getImageUrl(product.image),
                                    stock: Number(product.stock),
                                    cartQuantity: cartItems.find((item) => item.product_id === product.id)?.quantity || 0,
                                    isFavorite: favorites.includes(product.id),
                                }))}
                                onAddToCart={handleAddToCart}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        ))}
                </Box>
            </Container>
        </>
    );
};

export default Products;