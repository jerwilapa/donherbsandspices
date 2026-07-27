import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Button,
    Container,
    Paper,
    Stack,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import Navbar from "../../components/Navbar/NavBar";
import { getAdminCategories, createCategory, deleteCategory } from "../../services/adminService";
import { showToast } from "../../helper/showToast";

const AdminCategories = () => {
    const { data: categories = [], isLoading, refetch } = useQuery({
        queryKey: ["adminCategories"],
        queryFn: getAdminCategories,
        retry: false,
    });

    const [form, setForm] = useState({ name: "", image: "" });
    const [saving, setSaving] = useState(false);

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleCreate = async () => {
        if (!form.name) {
            showToast("error", "Category name is required.");
            return;
        }

        try {
            setSaving(true);
            await createCategory({ name: form.name, image: form.image });
            showToast("success", "Category created.");
            setForm({ name: "", image: "" });
            refetch();
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Unable to create category.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (categoryId: number) => {
        try {
            await deleteCategory(categoryId);
            showToast("success", "Category deleted.");
            refetch();
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Unable to delete category.");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <Container sx={{ py: 6, flex: 1 }}>
                <Typography variant="h4" fontWeight={700} mb={3}>
                    Admin Categories
                </Typography>

                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>
                        Add New Category
                    </Typography>
                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                        <TextField fullWidth label="Name" value={form.name} onChange={handleChange("name")} />
                        <TextField fullWidth label="Image URL" value={form.image} onChange={handleChange("image")} />
                    </Box>
                    <Box sx={{ mt: 3 }}>
                        <Button variant="contained" onClick={handleCreate} disabled={saving}>
                            {saving ? "Saving..." : "Create category"}
                        </Button>
                    </Box>
                </Paper>

                {isLoading ? (
                    <Box display="grid" sx={{ placeItems: "center" }} py={10}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {categories.map((category: any) => (
                            <Paper key={category.id} variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            {category.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ID: {category.id}
                                        </Typography>
                                    </Box>
                                    <Button variant="outlined" color="error" onClick={() => handleDelete(category.id)}>
                                        Delete
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default AdminCategories;
