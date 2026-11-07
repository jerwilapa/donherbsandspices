import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { createCategory, deleteCategory, getAdminCategories, getAdminProducts, updateCategory } from "../../services/adminService";
import { showToast } from "../../helper/showToast";
import { MdAdd, MdCategory, MdDeleteOutline, MdEdit, MdSearch } from "react-icons/md";
import { groupCatalogProducts } from "../../utils/productCatalog";

const AdminCategories = () => {
    const { data: categories = [], isLoading: loadingCategories, refetch } = useQuery({ queryKey: ["adminCategories"], queryFn: getAdminCategories, retry: false });
    const { data: products = [], isLoading: loadingProducts } = useQuery({ queryKey: ["adminProducts"], queryFn: getAdminProducts, retry: false });
    const catalogProducts = useMemo(
        () => groupCatalogProducts(Array.isArray(products) ? products : []),
        [products],
    );
    const [form, setForm] = useState({ name: "", image: "" });
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const visibleCategories = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        return (Array.isArray(categories) ? categories : []).filter((category: any) => !normalized || `${category.name} ${category.id}`.toLowerCase().includes(normalized));
    }, [categories, search]);

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const openCreate = () => {
        setEditingCategory(null);
        setForm({ name: "", image: "" });
        setFormOpen(true);
    };

    const openEdit = (category: any) => {
        setEditingCategory(category);
        setForm({ name: category.name, image: category.image || "" });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            showToast("error", "Category name is required.");
            return;
        }

        try {
            setSaving(true);
            if (editingCategory) {
                await updateCategory(editingCategory.id, { name: form.name.trim(), image: form.image.trim() });
                showToast("success", "Category updated.");
            } else {
                await createCategory({ name: form.name.trim(), image: form.image.trim() });
                showToast("success", "Category created.");
            }
            setFormOpen(false);
            setEditingCategory(null);
            setForm({ name: "", image: "" });
            await refetch();
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Unable to save category.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await deleteCategory(deleteTarget.id);
            showToast("success", "Category deleted.");
            setDeleteTarget(null);
            await refetch();
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Unable to delete category.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1.5}>
                <Box>
                    <Typography variant="body2" color="text.secondary">Group products so customers can browse the catalog.</Typography>
                    <Typography variant="body2" fontWeight={650} sx={{ mt: 0.5 }}>{categories.length} categories · {catalogProducts.length} products · {products.length} pack sizes</Typography>
                </Box>
                <Button variant="contained" startIcon={<MdAdd />} onClick={openCreate}>Add category</Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "8px", borderColor: "#e2e8df" }}>
                <TextField fullWidth size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" InputProps={{ startAdornment: <Box sx={{ display: "flex", mr: 1, color: "#718078" }}><MdSearch /></Box> }} />
            </Paper>

            {loadingCategories || loadingProducts ? <Box sx={{ display: "grid", placeItems: "center", py: 9 }}><CircularProgress /></Box> : (
                <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e2e8df", overflow: "hidden" }}>
                    {visibleCategories.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: "center", bgcolor: "#fafbf9" }}>
                            <Box sx={{ display: "grid", placeItems: "center", mb: 1, color: "#6f8b72", fontSize: 26 }}><MdCategory /></Box>
                            <Typography fontWeight={700}>{categories.length ? "No matching categories" : "No categories yet"}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{categories.length ? "Try a different search." : "Add categories to organize products in your store."}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 620 }}>
                                <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Category</TableCell><TableCell>Products</TableCell><TableCell>Image</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {visibleCategories.map((category: any) => {
                                        const count = catalogProducts.filter((product) => String(product.variants[0]?.product.category_id) === String(category.id)).length;
                                        return (
                                            <TableRow key={category.id} hover>
                                                <TableCell><Typography variant="body2" fontWeight={700}>{category.name}</Typography><Typography variant="caption" color="text.secondary">ID {category.id}</Typography></TableCell>
                                                <TableCell>{count}</TableCell>
                                                <TableCell>{category.image ? <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{category.image}</Typography> : <Typography variant="caption" color="text.secondary">No image</Typography>}</TableCell>
                                                <TableCell align="right"><Stack direction="row" justifyContent="flex-end"><IconButton aria-label={`Edit ${category.name}`} size="small" onClick={() => openEdit(category)}><MdEdit /></IconButton><IconButton aria-label={`Delete ${category.name}`} size="small" color="error" onClick={() => setDeleteTarget(category)}><MdDeleteOutline /></IconButton></Stack></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Paper>
            )}

            <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 750 }}>{editingCategory ? "Edit category" : "Add category"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField autoFocus fullWidth label="Category name" value={form.name} onChange={handleChange("name")} />
                        <TextField fullWidth label="Image URL" value={form.image} onChange={handleChange("image")} helperText="Optional. Paste a publicly accessible image URL." />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button disabled={saving} onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button variant="contained" disabled={saving} onClick={handleSave}>{saving ? <CircularProgress size={18} color="inherit" /> : editingCategory ? "Save changes" : "Create category"}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
                <DialogTitle sx={{ fontWeight: 750 }}>Delete {deleteTarget?.name}?</DialogTitle>
                <DialogContent><Typography variant="body2" color="text.secondary">Products in this category will remain in your catalog but become uncategorized.</Typography></DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button color="error" variant="contained" disabled={deleting} onClick={handleDelete}>{deleting ? <CircularProgress size={18} color="inherit" /> : "Delete category"}</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default AdminCategories;
