import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
    CircularProgress,
    Divider,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import Navbar from "../../components/Navbar/NavBar";
import { getAdminOrders, updateOrderStatus } from "../../services/adminService";
import { showToast } from "../../helper/showToast";

const statusOptions = ["placed", "processing", "shipped", "delivered", "cancelled"];

const AdminOrders = () => {
    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ["adminOrders"],
        queryFn: getAdminOrders,
        retry: false,
    });
    const [selectedStatus, setSelectedStatus] = useState<Record<number, string>>({});
    const [saving, setSaving] = useState<Record<number, boolean>>({});

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
            showToast("success", "Order status updated.");
            refetch();
        } catch (err: any) {
            showToast("error", err?.response?.data?.message || "Unable to update status.");
        } finally {
            setSaving((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <Container sx={{ py: 6, flex: 1 }}>
                <Typography variant="h4" fontWeight={700} mb={3}>
                    Admin Orders
                </Typography>

                {isLoading ? (
                    <Box display="grid" sx={{ placeItems: "center" }} py={10}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {orders.map((order: any) => (
                            <Paper key={order.id} variant="outlined" sx={{ p: 3 }}>
                                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700}>
                                            Order #{order.id}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Customer: {order.user_id}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total: ₱{order.total}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Items: {order.itemCount}
                                        </Typography>
                                    </Box>

                                    <FormControl sx={{ minWidth: 180 }}>
                                        <InputLabel id={`status-label-${order.id}`}>Status</InputLabel>
                                        <Select
                                            labelId={`status-label-${order.id}`}
                                            value={
                                                selectedStatus[order.id] ?? (typeof order.status === "number" || /^(\d+)$/i.test(String(order.status))
                                                    ? (statusOptions[Number(order.status) - 1] ?? String(order.status))
                                                    : order.status)
                                            }
                                            label="Status"
                                            onChange={handleStatusChange(order.id)}
                                        >
                                            {statusOptions.map((status) => (
                                                <MenuItem key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <Button
                                        variant="contained"
                                        disabled={saving[order.id]}
                                        onClick={() => handleSave(order.id)}
                                    >
                                        {saving[order.id] ? "Saving..." : "Save status"}
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

export default AdminOrders;
