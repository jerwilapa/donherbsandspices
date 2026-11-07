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
    const categoryCounts = useMemo(() => {
        return products.reduce((acc: any, product: any) => {
            acc[product.category_id] =
                (acc[product.category_id] || 0) + 1;
            return acc;
        }, {});
    }, [products]);
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
                            : products.slice(0, 10).map((item: any) => (
                                <ProductCard
                                    key={item.id}
                                    productId={item.id}
                                    name={item.name}
                                    price={item.price}
                                    image={getImageUrl(item.image)}
                                    stock={item.stock}
                                    onAddToCart={async (productId) => {
                                        await addToCart(productId, 1);
                                        window.dispatchEvent(new Event("cartUpdated"));
                                    }}
                                    onToggleFavorite={handleToggleFavorite}
                                    isFavorite={favorites.includes(item.id)}
                                />
                            ))}
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default Home;