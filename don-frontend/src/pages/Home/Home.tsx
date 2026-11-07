import {
    Box,
    Container,
    Typography,
    Skeleton,
} from "@mui/material";

import Hero from "../../components/Hero/Hero";
import Navbar from "../../components/Navbar/NavBar";
import ProductCard from "../../components/ProductCard/ProductCard";
import CategoryCard from "../../components/CategoryCard/CategoryCard";

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchCategories, fetchProducts } from "../../services/homeServices";
import { addToCart } from "../../services/cartService";
import { getImageUrl } from "../../utils/image";
import { useEffect, useMemo, useState } from "react";
import { toggleFavorite } from "../../services/favoriteApi";
import api from "../../api/axios";
import { groupCatalogProducts } from "../../utils/productCatalog";

const Home = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<number[]>([]);
    useEffect(() => {
        const loadFavorites = async () => {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            if (!user?.id) return;

            const res = await api.get(`/favorites/${user.id}`);

            setFavorites(res.data.map((f: any) => f.product_id));
        };

        loadFavorites();
    }, []);
    // 📦 CATEGORIES
    const {
        data: categories = [],
        isLoading: loadingCategories,
    } = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    // 📦 PRODUCTS
    const {
        data: products = [],
        isLoading: loadingProducts,
    } = useQuery({
        queryKey: ["products"],
        queryFn: fetchProducts,
    });
    const catalogProducts = useMemo(() => groupCatalogProducts(products), [products]);
    const categoryCounts = useMemo(() => {
        return catalogProducts.reduce((acc: Record<string, number>, group) => {
            const categoryId = group.variants[0]?.product.category_id;
            if (categoryId !== null && categoryId !== undefined) {
                acc[categoryId] = (acc[categoryId] || 0) + 1;
            }
            return acc;
        }, {});
    }, [catalogProducts]);
    const handleToggleFavorite = async (productId: number) => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!user?.id) return;

        try {
            const res = await toggleFavorite(user.id, productId);

            setFavorites((prev) =>
                res.favorite
                    ? [...prev, productId]
                    : prev.filter((id) => id !== productId)
            );
        } catch (err) {
            console.error(err);
        }
    };
    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            <Box sx={{ flex: 1 }}>
                <Hero />

                <Container sx={{ mt: 6 }}>
                    {/* CATEGORIES */}
                    <Typography variant="h4" fontWeight="bold">
                        Shop by Category
                    </Typography>

                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, 1fr)",
                                sm: "repeat(3, 1fr)",
                                md: "repeat(5, 1fr)",
                            },
                            gap: 3,
                        }}
                    >
                        {loadingCategories
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    variant="rounded"
                                    height={170}
                                    animation="wave"
                                />
                            ))
                            : categories.map((cat: any) => (
                                <CategoryCard
                                    key={cat.id}
                                    title={cat.name}
                                    image={getImageUrl(cat.image)}
                                    count={categoryCounts[cat.id] || 0}
                                    onClick={() =>
                                        navigate(`/products?category=${cat.id}`)
                                    }
                                />
                            ))}
                    </Box>

                    {/* PRODUCTS */}
                    <Typography variant="h4" fontWeight="bold" mt={8} mb={3}>
                        Featured Products
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                md: "repeat(4, 1fr)",
                            },
                            gap: 3,
                            gridAutoRows: "1fr",
                            alignItems: "stretch",
                        }}
                    >
                        {loadingProducts
                            ? Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    variant="rounded"
                                    height={350}
                                    animation="wave"
                                />
                            ))
                            : catalogProducts.slice(0, 10).map((group) => (
                                <ProductCard
                                    key={`${group.variants[0]?.product.category_id ?? ""}:${group.name}`}
                                    name={group.name}
                                    variants={group.variants.map(({ product, size }) => ({
                                        productId: product.id,
                                        size,
                                        price: Number(product.price),
                                        image: getImageUrl(product.image),
                                        stock: Number(product.stock),
                                        isFavorite: favorites.includes(product.id),
                                    }))}
                                    onAddToCart={async (productId) => {
                                        await addToCart(productId, 1);
                                        window.dispatchEvent(new Event("cartUpdated"));
                                    }}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))}
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;