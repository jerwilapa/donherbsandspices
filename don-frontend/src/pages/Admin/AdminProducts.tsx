import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { getImageUrl } from "../../utils/image";
import { createProduct, deleteProduct, getAdminCategories, getAdminProducts, updateProduct } from "../../services/adminService";
import { showToast } from "../../helper/showToast";
import { MdAdd, MdDeleteOutline, MdEdit, MdInventory2, MdSearch, MdUploadFile } from "react-icons/md";

type ProductForm = { name: string; price: string; stock: string; category_id: string };
const emptyForm: ProductForm = { name: "", price: "", stock: "0", category_id: "" };

const AdminProducts = () => {
    const { data: products = [], isLoading: loadingProducts, refetch } = useQuery({ queryKey: ["adminProducts"], queryFn: getAdminProducts, retry: false });
    const { data: categories = [], isLoading: loadingCategories } = useQuery({ queryKey: ["adminCategories"], queryFn: getAdminCategories, retry: false });
    const [form, setForm] = useState<ProductForm>(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");

    const visibleProducts = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        return (Array.isArray(products) ? products : []).filter((product: any) => {
            const category = categories.find((item: any) => item.id === product.category_id)?.name || "";
            return !normalized || `${product.name} ${category} ${product.id}`.toLowerCase().includes(normalized);
        });
    }, [products, categories, search]);

    const openCreate = () => {
        setEditingProduct(null);
        setForm(emptyForm);
        setImageFile(null);
        setFormOpen(true);
    };

    const openEdit = (product: any) => {
        setEditingProduct(product);
        setForm({ name: product.name, price: String(product.price), stock: String(product.stock), category_id: product.category_id ? String(product.category_id) : "" });
        setImageFile(null);
        setFormOpen(true);
    };

    const handleSave = async () => {
        const price = Number(form.price);
        const stock = Number(form.stock);
        if (!form.name.trim() || form.price.trim() === "" || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
            showToast("error", "Enter a product name, a valid price, and a non-negative whole-number stock quantity.");
            return;
        }
        if (form.category_id && !categories.some((category: any) => String(category.id) === form.category_id)) {
            showToast("error", "Select a valid category.");
            return;
        }

        const payload = new FormData();
        payload.append("name", form.name.trim());
        payload.append("price", String(price));
        payload.append("stock", String(stock));
        payload.append("category_id", form.category_id);
        if (imageFile) payload.append("image", imageFile);

        try {
            setSaving(true);
            if (editingProduct) {
                await updateProduct(editingProduct.id, payload);
                showToast("success", "Product updated.");
            } else {
                await createProduct(payload);
                showToast("success", "Product created.");
            }
            setEditingProduct(null);
            setFormOpen(false);
            setImageFile(null);
            setForm(emptyForm);
            await refetch();
        } catch (error: any) {
            showToast("error", error?.response?.data?.message || "Unable to save product.");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await deleteProduct(deleteTarget.id);
            showToast("success", "Product deleted.");
            setDeleteTarget(null);
            await refetch();
        } catch (error: any) {
            showToast("error", error?.response?.data?.message || "Unable to delete product.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1.5}>
                <Box>
                    <Typography variant="body2" color="text.secondary">Maintain your catalog, pricing, and stock.</Typography>
                    <Typography variant="body2" fontWeight={650} sx={{ mt: 0.5 }}>{products.length} products · {products.filter((product: any) => Number(product.stock) <= 5).length} low stock</Typography>
                </Box>
                <Button variant="contained" startIcon={<MdAdd />} onClick={openCreate}>Add product</Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "8px", borderColor: "#e2e8df" }}>
                <TextField fullWidth size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or categories" InputProps={{ startAdornment: <Box sx={{ display: "flex", mr: 1, color: "#718078" }}><MdSearch /></Box> }} />
            </Paper>

            {loadingProducts || loadingCategories ? <Box sx={{ display: "grid", placeItems: "center", py: 9 }}><CircularProgress /></Box> : (
                <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e2e8df", overflow: "hidden" }}>
                    {visibleProducts.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: "center", bgcolor: "#fafbf9" }}>
                            <Box sx={{ display: "grid", placeItems: "center", mb: 1, color: "#6f8b72", fontSize: 26 }}><MdInventory2 /></Box>
                            <Typography fontWeight={700}>{products.length ? "No matching products" : "Your catalog is empty"}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{products.length ? "Try a different search." : "Add your first product to start building the storefront."}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 760 }}>
                                <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Price</TableCell><TableCell>Stock</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {visibleProducts.map((product: any) => {
                                        const category = categories.find((item: any) => item.id === product.category_id)?.name || "Uncategorized";
                                        const quantity = Number(product.stock);
                                        return (
                                            <TableRow key={product.id} hover>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                                        <Box component="img" src={getImageUrl(product.image)} alt="" sx={{ width: 44, height: 44, objectFit: "cover", borderRadius: "6px", bgcolor: "#eef2ec" }} />
                                                        <Box><Typography variant="body2" fontWeight={700}>{product.name}</Typography><Typography variant="caption" color="text.secondary">ID {product.id}</Typography></Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>{category}</TableCell>
                                                <TableCell sx={{ fontWeight: 650 }}>₱{Number(product.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell><Chip size="small" label={`${quantity} units`} color={quantity <= 0 ? "error" : quantity <= 5 ? "warning" : "success"} /></TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" justifyContent="flex-end">
                                                        <IconButton aria-label={`Edit ${product.name}`} size="small" onClick={() => openEdit(product)}><MdEdit /></IconButton>
                                                        <IconButton aria-label={`Delete ${product.name}`} size="small" color="error" onClick={() => setDeleteTarget(product)}><MdDeleteOutline /></IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Paper>
            )}

            <Dialog open={formOpen} onClose={() => { setFormOpen(false); setEditingProduct(null); setForm(emptyForm); setImageFile(null); }} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 750 }}>{editingProduct ? "Edit product" : "Add product"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField autoFocus fullWidth label="Product name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField fullWidth label="Price (PHP)" type="number" inputProps={{ min: 0, step: "0.01" }} value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
                            <TextField fullWidth label="Stock quantity" type="number" inputProps={{ min: 0, step: 1 }} value={form.stock} onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))} />
                        </Stack>
                        <FormControl fullWidth>
                            <InputLabel id="product-category-label">Category</InputLabel>
                            <Select labelId="product-category-label" value={form.category_id} label="Category" onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}>
                                <MenuItem value="">Uncategorized</MenuItem>
                                {categories.map((category: any) => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        {editingProduct?.image && !imageFile && <Typography variant="caption" color="text.secondary">Current image will be kept unless replaced.</Typography>}
                        <Button component="label" variant="outlined" startIcon={<MdUploadFile />} sx={{ justifyContent: "flex-start", textTransform: "none" }}>
                            {imageFile?.name || "Choose product image"}
                            <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                        </Button>
                        <Typography variant="caption" color="text.secondary">JPG, PNG, or WebP. Maximum 5 MB.</Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => { setFormOpen(false); setEditingProduct(null); setForm(emptyForm); setImageFile(null); }}>Cancel</Button>
                    <Button variant="contained" disabled={saving} onClick={handleSave}>{saving ? <CircularProgress size={18} color="inherit" /> : editingProduct ? "Save changes" : "Create product"}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
                <DialogTitle sx={{ fontWeight: 750 }}>Delete {deleteTarget?.name}?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">This also removes the product from carts and favorites, and deletes its line items from past orders.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button color="error" variant="contained" disabled={deleting} onClick={confirmDelete}>{deleting ? <CircularProgress size={18} color="inherit" /> : "Delete product"}</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default AdminProducts;