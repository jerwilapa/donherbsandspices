import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Button,
    Container,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";

import Navbar from "../../components/Navbar/NavBar";
import { getImageUrl } from "../../utils/image";
import {
    getAdminProducts,
    getAdminCategories,
    createProduct,
    updateProduct,
    deleteProduct
} from "../../services/adminService";

import { showToast } from "../../helper/showToast";

const AdminProducts = () => {
    const { data: products = [], isLoading: loadingProducts, refetch } = useQuery({
        queryKey: ["adminProducts"],
        queryFn: getAdminProducts,
        retry: false,
    });

    const { data: categories = [], isLoading: loadingCategories } = useQuery({
        queryKey: ["adminCategories"],
        queryFn: getAdminCategories,
        retry: false,
    });

    const [form, setForm] = useState({
        name: "",
        price: "",
        stock: "",
        category_id: "",
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const handleChange =
        (field: string) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, [field]: event.target.value }));
            };

    const handleSave = async () => {
        if (!form.name || !form.price) {
            showToast("error", "Product name and price are required.");
            return;
        }

        if (
            form.category_id &&
            !categories.some((c: any) => String(c.id) === form.category_id)
        ) {
            showToast("error", "Select a valid category.");
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("price", form.price);
            formData.append("stock", String(form.stock || 0));
            formData.append("category_id", form.category_id || "");

            if (imageFile) {
                formData.append("image", imageFile);
            }

            if (editingId) {
                await updateProduct(editingId, formData);
                showToast("success", "Product updated.");
                setEditingId(null);
            } else {
                await createProduct(formData);
                showToast("success", "Product created.");
            }

            setForm({
                name: "",
                price: "",
                stock: "",
                category_id: "",
            });

            setImageFile(null);
            refetch();
        } catch (err: any) {
            showToast(
                "error",
                err?.response?.data?.message || "Unable to save product."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setForm({
            name: product.name,
            price: String(product.price),
            stock: String(product.stock),
            category_id: product.category_id ? String(product.category_id) : "",
        });

        setImageFile(null); // optional: force re-upload if needed
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({
            name: "",
            price: "",
            stock: "",
            category_id: "",
        });
        setImageFile(null);
    };

    const handleDelete = async (productId: number) => {
        try {
            await deleteProduct(productId);
            showToast("success", "Product deleted.");
            refetch();
        } catch (err: any) {
            showToast(
                "error",
                err?.response?.data?.message || "Unable to delete product."
            );
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            <Container sx={{ py: 6, flex: 1 }}>
                <Typography variant="h4" fontWeight={700} mb={3}>
                    Admin Products
                </Typography>

                {/* FORM */}
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        {editingId ? "Edit Product" : "Add New Product"}
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Name" value={form.name} onChange={handleChange("name")} />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Price" value={form.price} onChange={handleChange("price")} />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Stock" value={form.stock} onChange={handleChange("stock")} />
                        </Grid>

                        {/* IMAGE UPLOAD */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Button variant="outlined" component="label" fullWidth>
                                Upload Image
                                <input
                                    hidden
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setImageFile(e.target.files?.[0] || null)
                                    }
                                />
                            </Button>

                            {imageFile && (
                                <Typography variant="caption">
                                    {imageFile.name}
                                </Typography>
                            )}
                        </Grid>

                        {/* CATEGORY */}
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={form.category_id}
                                    label="Category"
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            category_id: e.target.value,
                                        }))
                                    }
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {categories.map((c: any) => (
                                        <MenuItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                        <Button variant="contained" onClick={handleSave} disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update product"
                                    : "Create product"}
                        </Button>

                        {editingId && (
                            <Button variant="outlined" onClick={handleCancel} sx={{ ml: 1 }}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                </Paper>

                {/* LIST */}
                {loadingProducts || loadingCategories ? (
                    <Box display="grid" sx={{ placeItems: "center" }} py={10}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {products.map((product: any) => (
                            <Paper key={product.id} variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                    <Box>
                                        <Typography fontWeight={700}>
                                            {product.name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            ₱{product.price} · stock: {product.stock}
                                        </Typography>

                                        {product.image && (
                                            <Box
                                                component="img"
                                                src={getImageUrl(product.image)}
                                                sx={{
                                                    width: 50,
                                                    height: 50,
                                                    objectFit: "cover",
                                                    mt: 1,
                                                    borderRadius: 1,
                                                }}
                                            />
                                        )}
                                    </Box>

                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        <Button onClick={() => handleEdit(product)}>
                                            Edit
                                        </Button>
                                        <Button
                                            color="error"
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default AdminProducts;