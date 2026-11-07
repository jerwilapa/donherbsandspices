import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Alert,
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
import { groupCatalogProducts } from "../../utils/productCatalog";
import { bulkUpdateProductPrices, createProduct, deleteProduct, getAdminCategories, getAdminProducts, updateProduct } from "../../services/adminService";
import { showToast } from "../../helper/showToast";
import { MdAdd, MdDeleteOutline, MdEdit, MdInventory2, MdPriceChange, MdSearch, MdUploadFile } from "react-icons/md";

type ProductForm = { name: string; price: string; stock: string; category_id: string };
const emptyForm: ProductForm = { name: "", price: "", stock: "0", category_id: "" };
type PriceImportMatch = {
    name: string;
    oneKg: { productId: number; oldPrice: number; sourcePrice: number };
    fiveHundredG: { productId: number; oldPrice: number; sourcePrice: number };
};

const AdminProducts = () => {
    const queryClient = useQueryClient();
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
    const [priceImportOpen, setPriceImportOpen] = useState(false);
    const [priceImportLoading, setPriceImportLoading] = useState(false);
    const [priceImportApplying, setPriceImportApplying] = useState(false);
    const [priceImportFileName, setPriceImportFileName] = useState("");
    const [priceImportError, setPriceImportError] = useState("");
    const [priceImportRows, setPriceImportRows] = useState<PriceImportMatch[]>([]);
    const [priceImportUnmatched, setPriceImportUnmatched] = useState<string[]>([]);
    const [priceImportWarnings, setPriceImportWarnings] = useState<string[]>([]);

    const catalogProducts = useMemo(
        () => groupCatalogProducts(Array.isArray(products) ? products : []),
        [products],
    );
    const lowStockVariants = products.filter((product: any) => Number(product.stock) <= 5).length;
    const visibleProducts = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        return catalogProducts.filter((group) => {
            const categoryId = group.variants[0]?.product.category_id;
            const category = categories.find((item: any) => String(item.id) === String(categoryId))?.name || "";
            const searchable = `${group.name} ${category} ${group.variants.map(({ product, size }) => `${size} ${product.id}`).join(" ")}`;
            return !normalized || searchable.toLowerCase().includes(normalized);
        });
    }, [catalogProducts, categories, search]);

    const closePriceImport = (force = false) => {
        if (!force && (priceImportLoading || priceImportApplying)) return;
        setPriceImportOpen(false);
        setPriceImportFileName("");
        setPriceImportError("");
        setPriceImportRows([]);
        setPriceImportUnmatched([]);
        setPriceImportWarnings([]);
    };

    const handlePriceListSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setPriceImportLoading(true);
        setPriceImportFileName(file.name);
        setPriceImportError("");
        setPriceImportRows([]);
        setPriceImportUnmatched([]);
        setPriceImportWarnings([]);

        try {
            const { normalizePriceListProductName, parsePriceListFile } = await import("../../utils/priceListImport");
            const parsed = await parsePriceListFile(file);
            const sourceByName = new Map<string, (typeof parsed.rows)>();
            for (const row of parsed.rows) {
                const key = normalizePriceListProductName(row.name);
                const sourceRows = sourceByName.get(key) || [];
                sourceRows.push(row);
                sourceByName.set(key, sourceRows);
            }

            const catalogByName = new Map<string, typeof catalogProducts>();
            for (const group of catalogProducts) {
                const key = normalizePriceListProductName(group.name);
                const matches = catalogByName.get(key) || [];
                matches.push(group);
                catalogByName.set(key, matches);
            }

            const matched: PriceImportMatch[] = [];
            const unmatched: string[] = [];
            for (const [key, sourceRows] of sourceByName) {
                if (sourceRows.length !== 1) {
                    unmatched.push(`${sourceRows[0].name} (duplicate in file)`);
                    continue;
                }

                const groups = catalogByName.get(key) || [];
                if (groups.length !== 1) {
                    unmatched.push(sourceRows[0].name);
                    continue;
                }

                const group = groups[0];
                const oneKg = group.variants.find(({ size }) => size.toLowerCase() === "1kg")?.product;
                const fiveHundredG = group.variants.find(({ size }) => size.toLowerCase() === "500g")?.product;
                if (!oneKg || !fiveHundredG) {
                    unmatched.push(`${sourceRows[0].name} (missing a 1kg or 500g catalog size)`);
                    continue;
                }

                matched.push({
                    name: group.name,
                    oneKg: {
                        productId: oneKg.id,
                        oldPrice: Number(oneKg.price),
                        sourcePrice: sourceRows[0].oneKg,
                    },
                    fiveHundredG: {
                        productId: fiveHundredG.id,
                        oldPrice: Number(fiveHundredG.price),
                        sourcePrice: sourceRows[0].fiveHundredG,
                    },
                });
            }

            setPriceImportRows(matched);
            setPriceImportUnmatched(unmatched);
            setPriceImportWarnings(parsed.warnings);
            if (matched.length === 0) {
                setPriceImportError("No products matched. Check the product names and 1kg/500g columns in the file.");
            }
        } catch (error) {
            setPriceImportError(error instanceof Error ? error.message : "Unable to read this pricelist.");
        } finally {
            setPriceImportLoading(false);
        }
    };

    const handleApplyPriceImport = async () => {
        const updates = priceImportRows.flatMap((row) => [
            { productId: row.oneKg.productId, sourcePrice: row.oneKg.sourcePrice },
            { productId: row.fiveHundredG.productId, sourcePrice: row.fiveHundredG.sourcePrice },
        ]);
        if (updates.length === 0) return;

        try {
            setPriceImportApplying(true);
            const result = await bulkUpdateProductPrices(updates);
            await queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
            showToast("success", `Updated prices for ${priceImportRows.length} products.`);
            closePriceImport(true);
            await refetch();
            if (result.updated !== updates.length) {
                showToast("error", "The server updated a different number of prices than expected.");
            }
        } catch (error: any) {
            showToast("error", error?.response?.data?.message || "Unable to apply the price updates.");
        } finally {
            setPriceImportApplying(false);
        }
    };

    const formatPrice = (value: number) =>
        `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const markedUpPrice = (sourcePrice: number) => Math.round(sourcePrice * 140) / 100;

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
                    <Typography variant="body2" fontWeight={650} sx={{ mt: 0.5 }}>{catalogProducts.length} products · {products.length} pack sizes · {lowStockVariants} low-stock pack sizes</Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="outlined" startIcon={<MdPriceChange />} onClick={() => setPriceImportOpen(true)}>Mass update prices</Button>
                    <Button variant="contained" startIcon={<MdAdd />} onClick={openCreate}>Add product</Button>
                </Stack>
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
                            <Table size="small" sx={{ minWidth: 900 }}>
                                <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Product</TableCell><TableCell>Category</TableCell><TableCell>Pack sizes and prices</TableCell><TableCell>Stock</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {visibleProducts.map((group) => {
                                        const product = group.variants[0].product;
                                        const category = categories.find((item: any) => String(item.id) === String(product.category_id))?.name || "Uncategorized";
                                        return (
                                            <TableRow key={`${product.category_id}-${group.name}`} hover>
                                                <TableCell>
                                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                                        <Box component="img" src={getImageUrl(product.image)} alt="" sx={{ width: 44, height: 44, objectFit: "cover", borderRadius: "6px", bgcolor: "#eef2ec" }} />
                                                        <Box><Typography variant="body2" fontWeight={700}>{group.name}</Typography><Typography variant="caption" color="text.secondary">{group.variants.length} pack sizes</Typography></Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>{category}</TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.75}>
                                                        {group.variants.map(({ product: variant, size }) => (
                                                            <Stack key={variant.id} direction="row" alignItems="center" spacing={0.75}>
                                                                <Chip size="small" variant="outlined" label={size} sx={{ minWidth: 58 }} />
                                                                <Typography variant="body2" component="span">₱{Number(variant.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Typography>
                                                            </Stack>
                                                        ))}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack spacing={0.75}>
                                                        {group.variants.map(({ product: variant, size }) => {
                                                            const quantity = Number(variant.stock);
                                                            return <Chip key={variant.id} size="small" label={`${size}: ${quantity} units`} color={quantity <= 0 ? "error" : quantity <= 5 ? "warning" : "success"} />;
                                                        })}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack spacing={0.5} alignItems="flex-end">
                                                        {group.variants.map(({ product: variant, size }) => (
                                                            <Stack key={variant.id} direction="row" alignItems="center">
                                                                <Typography variant="caption" color="text.secondary">{size}</Typography>
                                                                <IconButton aria-label={`Edit ${variant.name}`} size="small" onClick={() => openEdit(variant)}><MdEdit /></IconButton>
                                                                <IconButton aria-label={`Delete ${variant.name}`} size="small" color="error" onClick={() => setDeleteTarget(variant)}><MdDeleteOutline /></IconButton>
                                                            </Stack>
                                                        ))}
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

            <Dialog open={priceImportOpen} onClose={closePriceImport} fullWidth maxWidth="lg">
                <DialogTitle sx={{ fontWeight: 750 }}>Mass update product prices</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                            Upload an Excel or PDF pricelist. The 1kg and 500g source prices will receive a 40% markup. Review the exact product matches and new prices before applying.
                        </Typography>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<MdUploadFile />}
                            disabled={priceImportLoading || priceImportApplying}
                            sx={{ alignSelf: "flex-start", textTransform: "none" }}
                        >
                            {priceImportFileName || "Choose Excel or PDF pricelist"}
                            <input hidden type="file" accept=".xlsx,.xls,.pdf,application/pdf" onChange={handlePriceListSelect} />
                        </Button>

                        {priceImportLoading && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <CircularProgress size={18} />
                                <Typography variant="body2">Reading pricelist…</Typography>
                            </Stack>
                        )}
                        {priceImportError && <Alert severity="error">{priceImportError}</Alert>}
                        {priceImportWarnings.length > 0 && (
                            <Alert severity="warning">
                                {priceImportWarnings.length} row(s) were skipped because a valid product name or both prices could not be read.
                                <Box component="ul" sx={{ my: 0.5, pl: 2.5 }}>
                                    {priceImportWarnings.slice(0, 5).map((warning) => <li key={warning}>{warning}</li>)}
                                    {priceImportWarnings.length > 5 && <li>And {priceImportWarnings.length - 5} more skipped rows.</li>}
                                </Box>
                            </Alert>
                        )}
                        {priceImportRows.length > 0 && (
                            <>
                                <Alert severity="info">
                                    {priceImportRows.length} matched product(s), {priceImportRows.length * 2} pack-size prices will be updated.
                                    {priceImportUnmatched.length > 0 && ` ${priceImportUnmatched.length} row(s) will be skipped because the product name did not match.`}
                                    {" "}The uploaded prices are treated as the source prices; the saved prices will be source price × 1.40.
                                </Alert>
                                {priceImportUnmatched.length > 0 && (
                                    <Alert severity="warning">
                                        Unmatched rows: {priceImportUnmatched.slice(0, 8).join(", ")}
                                        {priceImportUnmatched.length > 8 ? `, and ${priceImportUnmatched.length - 8} more.` : ""}
                                    </Alert>
                                )}
                                <Box sx={{ maxHeight: 420, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                                    <Table size="small" stickyHeader sx={{ minWidth: 950 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Product</TableCell>
                                                <TableCell>1kg source</TableCell>
                                                <TableCell>1kg current → new</TableCell>
                                                <TableCell>500g source</TableCell>
                                                <TableCell>500g current → new</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {priceImportRows.map((row) => (
                                                <TableRow key={row.name}>
                                                    <TableCell>{row.name}</TableCell>
                                                        <TableCell>{formatPrice(row.oneKg.sourcePrice)}</TableCell>
                                                        <TableCell>{formatPrice(row.oneKg.oldPrice)} → {formatPrice(markedUpPrice(row.oneKg.sourcePrice))}</TableCell>
                                                    <TableCell>{formatPrice(row.fiveHundredG.sourcePrice)}</TableCell>
                                                        <TableCell>{formatPrice(row.fiveHundredG.oldPrice)} → {formatPrice(markedUpPrice(row.fiveHundredG.sourcePrice))}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button disabled={priceImportApplying || priceImportLoading} onClick={() => closePriceImport()}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={priceImportRows.length === 0 || priceImportApplying || priceImportLoading}
                        onClick={handleApplyPriceImport}
                    >
                        {priceImportApplying ? <CircularProgress size={18} color="inherit" /> : `Apply ${priceImportRows.length * 2} price updates`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default AdminProducts;