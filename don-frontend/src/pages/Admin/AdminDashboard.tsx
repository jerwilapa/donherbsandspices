import { Box, Button, Card, CardContent, Container, Grid, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Stack, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/NavBar";
import { useQuery } from "@tanstack/react-query";
import { getAdminOrders, getAdminProducts, getAdminCategories } from "../../services/adminService";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";

const StatCard = ({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) => (
    <Card sx={{ height: "100%", display: "flex", alignItems: "stretch" }}>
        <CardContent sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="overline" color="text.secondary">{title}</Typography>
                    <Typography variant="h5" fontWeight={700}>{value}</Typography>
                </Box>
                <Box sx={{ color: "primary.main", fontSize: 36 }}>{icon}</Box>
            </Stack>
        </CardContent>
    </Card>
);

const AdminDashboard = () => {
    const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery({ queryKey: ["adminOrders"], queryFn: getAdminOrders, retry: false });
    const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useQuery({ queryKey: ["adminProducts"], queryFn: getAdminProducts, retry: false });
    const { data: categories = [], isLoading: loadingCategories, refetch: refetchCategories } = useQuery({ queryKey: ["adminCategories"], queryFn: getAdminCategories, retry: false });

    const loading = loadingOrders || loadingProducts || loadingCategories;

    const recentOrders = Array.isArray(orders) ? orders.slice(0, 6) : [];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <Container sx={{ py: 6, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography variant="h4" fontWeight={700}>Admin Dashboard</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<RefreshIcon />} onClick={() => { refetchOrders(); refetchProducts(); refetchCategories(); }}>
                            Refresh
                        </Button>
                        <Button component={Link} to="/" variant="outlined">View Store</Button>
                    </Stack>
                </Stack>

                {loading ? (
                    <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Grid container spacing={3} mb={3}>
                            <Grid item xs={12} md={3}>
                                <StatCard title="Total Orders" value={orders.length} icon={<ShoppingCartIcon fontSize="inherit" />} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <StatCard title="Products" value={products.length} icon={<Inventory2Icon fontSize="inherit" />} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <StatCard title="Categories" value={categories.length} icon={<CategoryIcon fontSize="inherit" />} />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <StatCard title="Recent Activity" value={recentOrders.length} icon={<AssessmentIcon fontSize="inherit" />} />
                            </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={7}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" fontWeight={700} mb={1}>Recent Orders</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {recentOrders.length === 0 ? (
                                        <Typography color="text.secondary">No recent orders.</Typography>
                                    ) : (
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Order</TableCell>
                                                    <TableCell>Customer</TableCell>
                                                    <TableCell>Items</TableCell>
                                                    <TableCell>Total</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell align="right">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {recentOrders.map((o: any) => (
                                                    <TableRow key={o.id}>
                                                        <TableCell>#{o.id}</TableCell>
                                                        <TableCell>{o.user_id}</TableCell>
                                                        <TableCell>{o.itemCount ?? (o.items ? o.items.length : "-")}</TableCell>
                                                        <TableCell>₱{o.total}</TableCell>
                                                        <TableCell>{String(o.status)}</TableCell>
                                                        <TableCell align="right">
                                                            <Button component={Link} to="/admin/orders" size="small">Manage</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </Paper>
                            </Grid>

                            <Grid item xs={12} md={5}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" fontWeight={700} mb={1}>Quick Actions</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={2}>
                                        <Button component={Link} to="/admin/orders" variant="contained">Review Orders</Button>
                                        <Button component={Link} to="/admin/products" variant="outlined">Manage Products</Button>
                                        <Button component={Link} to="/admin/categories" variant="outlined">Manage Categories</Button>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default AdminDashboard;
