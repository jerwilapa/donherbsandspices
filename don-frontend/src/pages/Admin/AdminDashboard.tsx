import { Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminOrders, getAdminProducts, getAdminCategories, getAdminCustomers } from "../../services/adminService";
import { MdArrowForward, MdCategory, MdInventory2, MdPayments, MdPeople, MdRefresh, MdShoppingBag, MdWarningAmber } from "react-icons/md";

type MetricProps = { label: string; value: string | number; note: string; icon: React.ReactNode; accent: string };

const Metric = ({ label, value, note, icon, accent }: MetricProps) => (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: "8px", height: "100%", borderColor: "#e2e8df" }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={750} sx={{ mt: 1, letterSpacing: 0 }}>{value}</Typography>
                <Typography variant="caption" color="text.secondary">{note}</Typography>
            </Box>
            <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: "8px", color: accent, bgcolor: `${accent}14`, fontSize: 21 }}>{icon}</Box>
        </Stack>
    </Paper>
);

const statusColor = (status: unknown) => {
    const value = String(status).toLowerCase();
    if (value === "delivered") return "success";
    if (value === "cancelled") return "error";
    if (value === "shipped") return "info";
    return "warning";
};

const AdminDashboard = () => {
    const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery({ queryKey: ["adminOrders"], queryFn: getAdminOrders, retry: false });
    const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useQuery({ queryKey: ["adminProducts"], queryFn: getAdminProducts, retry: false });
    const { data: categories = [], isLoading: loadingCategories, refetch: refetchCategories } = useQuery({ queryKey: ["adminCategories"], queryFn: getAdminCategories, retry: false });
    const { data: customers = [], isLoading: loadingCustomers, refetch: refetchCustomers } = useQuery({ queryKey: ["adminCustomers"], queryFn: getAdminCustomers, retry: false });

    const loading = loadingOrders || loadingProducts || loadingCategories || loadingCustomers;
    const recentOrders = Array.isArray(orders) ? orders.slice(0, 6) : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeOrders = Array.isArray(orders) ? orders : [];
    const pendingOrders = safeOrders.filter((order: any) => !["delivered", "cancelled"].includes(String(order.status).toLowerCase())).length;
    const lowStock = safeProducts.filter((product: any) => Number(product.stock) <= 5);
    const revenue = safeOrders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);

    return (
        <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                <Box>
                    <Typography variant="body2" color="text.secondary">Your store at a glance</Typography>
                    <Typography variant="body1" fontWeight={650}>Operations overview</Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<MdRefresh />} onClick={() => { refetchOrders(); refetchProducts(); refetchCategories(); refetchCustomers(); }}>Refresh</Button>
            </Stack>

            {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 9 }}><CircularProgress /></Box> : (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", xl: "repeat(5, 1fr)" }, gap: 1.5 }}>
                        <Metric label="Gross order value" value={`₱${revenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} note={`${safeOrders.length} orders recorded`} icon={<MdPayments />} accent="#37805a" />
                        <Metric label="Orders to process" value={pendingOrders} note="Open or in transit" icon={<MdShoppingBag />} accent="#bd7526" />
                        <Metric label="Active products" value={safeProducts.length} note={`${lowStock.length} at or below 5 units`} icon={<MdInventory2 />} accent="#477e87" />
                        <Metric label="Categories" value={safeCategories.length} note="Product groups" icon={<MdCategory />} accent="#9a6447" />
                        <Metric label="Customers" value={customers.length} note="Registered shoppers" icon={<MdPeople />} accent="#637546" />
                    </Box>

                    {lowStock.length > 0 && (
                        <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "#ead6b5", bgcolor: "#fffaf1", p: 1.75 }}>
                            <Stack direction="row" alignItems="center" spacing={1.25}>
                                <Box sx={{ color: "#a76517", display: "flex", fontSize: 20 }}><MdWarningAmber /></Box>
                                <Typography variant="body2" fontWeight={650}>{lowStock.length} product{lowStock.length === 1 ? "" : "s"} need a stock check</Typography>
                                <Button component={Link} to="/admin/products" size="small" endIcon={<MdArrowForward />} sx={{ ml: "auto" }}>Review inventory</Button>
                            </Stack>
                        </Paper>
                    )}

                    <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e2e8df", overflow: "hidden" }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={720}>Recent orders</Typography>
                                <Typography variant="body2" color="text.secondary">Latest customer activity</Typography>
                            </Box>
                            <Button component={Link} to="/admin/orders" endIcon={<MdArrowForward />}>All orders</Button>
                        </Stack>
                        {recentOrders.length === 0 ? (
                            <Box sx={{ px: 2, py: 5, textAlign: "center", bgcolor: "#fafbf9" }}>
                                <Typography fontWeight={650}>No orders yet</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Orders will appear here after a customer checks out.</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ overflowX: "auto" }}>
                                <Table size="small" sx={{ minWidth: 650 }}>
                                    <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Items</TableCell><TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell align="right"> </TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {recentOrders.map((order: any) => (
                                            <TableRow key={order.id} hover>
                                                <TableCell sx={{ fontWeight: 650 }}>#{order.id}</TableCell>
                                                <TableCell>Customer {order.user_id}</TableCell>
                                                <TableCell>{order.itemCount ?? "—"}</TableCell>
                                                <TableCell>₱{Number(order.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell><Chip size="small" label={String(order.status)} color={statusColor(order.status)} /></TableCell>
                                                <TableCell align="right"><Button component={Link} to="/admin/orders" size="small">Manage</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </Paper>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                        {[
                            { to: "/admin/orders", title: "Review orders", detail: "Update fulfillment status", icon: <MdShoppingBag /> },
                            { to: "/admin/products", title: "Manage products", detail: "Pricing, stock, and images", icon: <MdInventory2 /> },
                            { to: "/admin/categories", title: "Organize catalog", detail: "Create and edit categories", icon: <MdCategory /> },
                            { to: "/admin/customers", title: "View customers", detail: "Orders and customer value", icon: <MdPeople /> },
                        ].map((action) => (
                            <Button key={action.to} component={Link} to={action.to} variant="outlined" sx={{ justifyContent: "flex-start", textAlign: "left", textTransform: "none", p: 1.75, borderColor: "#e2e8df", borderRadius: "8px", bgcolor: "#fff", color: "#17241c" }}>
                                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                                    <Box sx={{ color: "#34714d", display: "flex", fontSize: 21 }}>{action.icon}</Box>
                                    <Box sx={{ flex: 1 }}><Typography variant="body2" fontWeight={700}>{action.title}</Typography><Typography variant="caption" color="text.secondary">{action.detail}</Typography></Box>
                                    <MdArrowForward />
                                </Stack>
                            </Button>
                        ))}
                    </Box>
                </>
            )}
        </Stack>
    );
};

export default AdminDashboard;
