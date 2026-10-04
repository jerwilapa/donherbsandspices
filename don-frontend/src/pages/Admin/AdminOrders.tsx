import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
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
import { getAdminOrderDetails, getAdminOrders, updateOrderStatus } from "../../services/adminService";
import { showToast } from "../../helper/showToast";
import { useQueryClient } from "@tanstack/react-query";
import { MdCheck, MdClose, MdSearch, MdShoppingBag, MdVisibility } from "react-icons/md";
import type { SelectChangeEvent } from "@mui/material/Select";

const statusOptions = ["placed", "processing", "shipped", "delivered", "cancelled"];
const formatStatus = (value: unknown) => {
    const status = String(value ?? "placed").toLowerCase();
    return /^\d+$/.test(status) ? statusOptions[Number(status) - 1] || status : status;
};
const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const AdminOrders = () => {
    const queryClient = useQueryClient();
    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ["adminOrders"],
        queryFn: getAdminOrders,
        retry: false,
    });
    const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState<Record<number, boolean>>({});
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [detailsId, setDetailsId] = useState<number | null>(null);
    const { data: orderDetails, isLoading: loadingDetails, isError: detailsError } = useQuery({
        queryKey: ["adminOrderDetails", detailsId],
        queryFn: () => getAdminOrderDetails(detailsId as number),
        enabled: detailsId !== null,
        retry: false,
    });

    const visibleOrders = useMemo(() => {
        const search = query.trim().toLowerCase();
        return (Array.isArray(orders) ? orders : []).filter((order: any) => {
            const status = formatStatus(order.status);
            const matchesStatus = statusFilter === "all" || status === statusFilter;
            const matchesSearch = !search || [order.id, order.user_id, order.customer_name, order.customer_email, order.delivery_method, status]
                .some((value) => String(value ?? "").toLowerCase().includes(search));
            return matchesStatus && matchesSearch;
        });
    }, [orders, query, statusFilter]);

    const handleStatusChange = (orderId: number) => (event: SelectChangeEvent<string>) => {
        setSelectedStatus((prev) => ({ ...prev, [orderId]: event.target.value }));
    };

    const handleSave = async (orderId: number) => {
        const status = selectedStatus[orderId];
        if (!status) {
            showToast("error", "Select a new status before saving.");
            return;
        }

        try {
            setSaving((prev) => ({ ...prev, [orderId]: true }));
            await updateOrderStatus(orderId, status);
            setSelectedStatus((prev) => ({ ...prev, [orderId]: status }));
            showToast("success", "Order status updated.");
            await refetch();
            await queryClient.invalidateQueries({ queryKey: ["adminOrderDetails", orderId] });
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Unable to update status.");
        } finally {
            setSaving((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    return (
        <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1.5}>
                <Box>
                    <Typography variant="body2" color="text.secondary">Review purchases and fulfillment progress.</Typography>
                    <Typography variant="body2" fontWeight={650} sx={{ mt: 0.5 }}>{orders.length} total orders</Typography>
                </Box>
                <Chip icon={<MdShoppingBag />} label={`${orders.filter((order: any) => !["delivered", "cancelled"].includes(formatStatus(order.status))).length} open`} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "#eaf0e7", color: "#31583c", fontWeight: 650 }} />
            </Stack>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "8px", borderColor: "#e2e8df" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <TextField
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search order, customer ID, delivery..."
                        size="small"
                        fullWidth
                        InputProps={{ startAdornment: <Box sx={{ display: "flex", mr: 1, color: "#718078" }}><MdSearch /></Box> }}
                    />
                    <FormControl size="small" sx={{ minWidth: { sm: 190 } }}>
                        <InputLabel id="order-status-filter-label">Status</InputLabel>
                        <Select labelId="order-status-filter-label" value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                            <MenuItem value="all">All statuses</MenuItem>
                            {statusOptions.map((status) => <MenuItem key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {isLoading ? <Box sx={{ display: "grid", placeItems: "center", py: 9 }}><CircularProgress /></Box> : (
                <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e2e8df", overflow: "hidden" }}>
                    {visibleOrders.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: "center", bgcolor: "#fafbf9" }}>
                            <Typography fontWeight={700}>{orders.length ? "No matching orders" : "No orders yet"}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{orders.length ? "Try a different search or status." : "New customer orders will appear here."}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 940 }}>
                                <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Order</TableCell><TableCell>Placed</TableCell><TableCell>Customer</TableCell><TableCell>Delivery</TableCell><TableCell>Items</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell align="right">Update</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {visibleOrders.map((order: any) => {
                                        const currentStatus = formatStatus(order.status);
                                        const chosenStatus = selectedStatus[order.id] ?? currentStatus;
                                        return (
                                            <TableRow key={order.id} hover>
                                                <TableCell sx={{ fontWeight: 700 }}>#{order.id}</TableCell>
                                                <TableCell>{formatDate(order.created_at)}</TableCell>
                                                <TableCell><Typography variant="body2" fontWeight={650}>{order.customer_name || `Customer ${order.user_id}`}</Typography><Typography variant="caption" color="text.secondary">{order.customer_email}</Typography></TableCell>
                                                <TableCell>{order.delivery_method || "—"}</TableCell>
                                                <TableCell>{order.itemCount ?? "—"}</TableCell>
                                                <TableCell sx={{ fontWeight: 650 }}>₱{Number(order.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell><Chip size="small" label={currentStatus} color={currentStatus === "delivered" ? "success" : currentStatus === "cancelled" ? "error" : currentStatus === "shipped" ? "info" : "warning"} /></TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" justifyContent="flex-end" spacing={0.75}>
                                                        <Button size="small" startIcon={<MdVisibility />} onClick={() => setDetailsId(order.id)}>Details</Button>
                                                        <FormControl size="small" sx={{ minWidth: 142 }}>
                                                            <Select aria-label={`New status for order ${order.id}`} value={chosenStatus} onChange={handleStatusChange(order.id)}>
                                                                {statusOptions.map((status) => <MenuItem key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</MenuItem>)}
                                                            </Select>
                                                        </FormControl>
                                                        <Button aria-label={`Save status for order ${order.id}`} variant="contained" size="small" disabled={saving[order.id] || chosenStatus === currentStatus} onClick={() => handleSave(order.id)} sx={{ minWidth: 40, px: 1 }}>
                                                            {saving[order.id] ? <CircularProgress size={16} color="inherit" /> : <MdCheck size={18} />}
                                                        </Button>
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

            <Dialog open={detailsId !== null} onClose={() => setDetailsId(null)} fullWidth maxWidth="md">
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 750 }}>
                    Order #{orderDetails?.id ?? detailsId}
                    <Button aria-label="Close order details" onClick={() => setDetailsId(null)} sx={{ minWidth: 36, px: 1, color: "#64736a" }}><MdClose size={20} /></Button>
                </DialogTitle>
                <DialogContent dividers>
                    {loadingDetails ? <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress /></Box> : detailsError ? (
                        <Alert severity="error">Order details could not be loaded. Check your admin session and backend connection.</Alert>
                    ) : orderDetails && (
                        <Stack spacing={2.5}>
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px", borderColor: "#e2e8df" }}>
                                    <Typography variant="overline" color="text.secondary">CUSTOMER</Typography>
                                    <Typography fontWeight={700}>{orderDetails.customer_name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{orderDetails.customer_email}</Typography>
                                    <Typography variant="caption" color="text.secondary">Customer ID {orderDetails.user_id}</Typography>
                                </Paper>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px", borderColor: "#e2e8df" }}>
                                    <Typography variant="overline" color="text.secondary">DELIVERY</Typography>
                                    {orderDetails.full_name ? <>
                                        <Typography fontWeight={700}>{orderDetails.full_name} · {orderDetails.phone}</Typography>
                                        <Typography variant="body2">{orderDetails.address_line}</Typography>
                                        <Typography variant="body2" color="text.secondary">{[orderDetails.barangay, orderDetails.municipality, orderDetails.province].filter(Boolean).join(", ")}</Typography>
                                        <Typography variant="body2" color="text.secondary">{[orderDetails.postal_code, orderDetails.country].filter(Boolean).join(" ")}</Typography>
                                    </> : <Typography variant="body2" color="text.secondary">No delivery address was stored for this order.</Typography>}
                                </Paper>
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Items</Typography>
                                {orderDetails.items?.length ? <Box sx={{ overflowX: "auto" }}><Table size="small" sx={{ minWidth: 460 }}>
                                    <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Product</TableCell><TableCell>Quantity</TableCell><TableCell>Unit price</TableCell><TableCell align="right">Line total</TableCell></TableRow></TableHead>
                                    <TableBody>{orderDetails.items.map((item: any) => <TableRow key={item.id}><TableCell>{item.product_name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>₱{Number(item.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell><TableCell align="right">₱{(Number(item.price) * Number(item.quantity)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell></TableRow>)}</TableBody>
                                </Table></Box> : <Typography variant="body2" color="text.secondary">No line items are available for this order.</Typography>}
                            </Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: "1px solid #e2e8df" }}>
                                <Typography variant="body2" color="text.secondary">{orderDetails.delivery_method || "Delivery method not recorded"}</Typography>
                                <Typography variant="h6" fontWeight={750}>Total ₱{Number(orderDetails.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Typography>
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Stack>
    );
};

export default AdminOrders;
