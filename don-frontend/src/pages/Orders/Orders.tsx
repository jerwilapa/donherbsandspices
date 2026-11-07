import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    Chip,
    CircularProgress,
    Divider,
} from "@mui/material";
import { MdExpandMore as ExpandMoreIcon } from "react-icons/md";
import Navbar from "../../components/Navbar/NavBar";
import { getOrders } from "../../services/orderService";

const statusSteps = ["Placed", "Processing", "Shipped", "Delivered"];

const normalizeStatus = (status: any) => {
    if (!status) return "Placed";

    const s = String(status).toLowerCase();

    if (s.includes("delivered") || s.includes("completed")) return "Delivered";
    if (s.includes("shipped")) return "Shipped";
    if (s.includes("processing")) return "Processing";
    return "Placed";
};

const getStepIndex = (status: string) =>
    statusSteps.findIndex((s) => s === status);

const Orders = () => {
    const [expanded, setExpanded] = useState<number | false>(false);

    const { data: orders = [], isLoading, isError } = useQuery({
        queryKey: ["orders"],
        queryFn: getOrders,
        retry: false,
    });

    const renderSteps = (current: string) => {
        const currentIndex = getStepIndex(current);

        return (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                {statusSteps.map((step, index) => {
                    const active = index <= currentIndex;

                    return (
                        <Box key={step} sx={{ display: "flex", flex: 1, alignItems: "center" }}>
                            <Box
                                sx={{
                                    flex: 1,
                                    textAlign: "center",
                                    transition: "transform 0.2s ease",
                                    willChange: "transform",
                                    transform: active ? "scale(1.05)" : "scale(1)",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: "50%",
                                        mx: "auto",
                                        mb: 0.5,
                                        display: "grid",
                                        placeItems: "center",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        bgcolor: active ? "primary.main" : "grey.300",
                                        color: active ? "#fff" : "text.secondary",
                                    }}
                                >
                                    {step[0]}
                                </Box>

                                <Typography variant="caption">
                                    {step}
                                </Typography>
                            </Box>

                            {index < statusSteps.length - 1 && (
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: 4,
                                        mx: 1,
                                        bgcolor: index < currentIndex ? "primary.main" : "grey.300",
                                        transition: "background-color 0.25s ease",
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Box>
        );
    };

    if (isLoading) {
        return (
            <Box sx={{ display: "grid", placeItems: "center", height: "70vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Container sx={{ py: 6 }}>
                <Typography>Failed to load orders.</Typography>
            </Container>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />

            <Container sx={{ py: 5, flex: 1 }}>
                <Typography variant="h4" fontWeight={700} mb={3}>
                    My Orders
                </Typography>

                {orders.length === 0 ? (
                    <Typography>No orders found.</Typography>
                ) : (
                    <Stack spacing={2}>
                        {orders.map((order: any) => {
                            const status = normalizeStatus(order.status);
                            const isOpen = expanded === order.id;

                            return (
                                <Paper
                                    key={order.id}
                                    sx={{
                                        borderRadius: 2,
                                        transition: "transform 0.2s ease",
                                        willChange: "transform",
                                        "&:hover": {
                                            /* apply shadow instantly, do not animate box-shadow */
                                            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                                            transform: "translateY(-2px)",
                                        },
                                    }}
                                >
                                    <Accordion
                                        expanded={isOpen}
                                        onChange={() =>
                                            setExpanded(isOpen ? false : order.id)
                                        }
                                        disableGutters
                                        sx={{
                                            boxShadow: "none",
                                            "&.Mui-expanded": {
                                                bgcolor: "rgba(25,118,210,0.03)",
                                            },
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Box sx={{ width: "100%" }}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography fontWeight={700}>
                                                            Order #{order.id}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {order.created_at
                                                                ? new Date(order.created_at).toLocaleString()
                                                                : "No date"}
                                                        </Typography>
                                                    </Box>

                                                    <Chip
                                                        label={status}
                                                        color={
                                                            status === "Delivered"
                                                                ? "success"
                                                                : status === "Shipped"
                                                                    ? "primary"
                                                                    : "warning"
                                                        }
                                                        size="small"
                                                    />
                                                </Box>

                                                {renderSteps(status)}
                                            </Box>
                                        </AccordionSummary>

                                        <AccordionDetails>
                                            <Divider sx={{ my: 2 }} />

                                            <Stack spacing={1}>
                                                {(order.items ?? []).map((item: any) => (
                                                    <Box
                                                        key={item.id}
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            bgcolor: "grey.50",
                                                            transition: "0.2s",
                                                            "&:hover": {
                                                                bgcolor: "grey.100",
                                                            },
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography fontWeight={600}>
                                                                {item.product_name}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                Qty: {item.quantity}
                                                            </Typography>
                                                        </Box>

                                                        <Typography fontWeight={700}>
                                                            ₱{item.price}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>

                                            <Box
                                                sx={{
                                                    mt: 3,
                                                    display: "flex",
                                                    justifyContent: "flex-end",
                                                    gap: 1,
                                                }}
                                            >
                                                <Chip
                                                    label="Copy ID"
                                                    clickable
                                                    onClick={() =>
                                                        navigator.clipboard.writeText(String(order.id))
                                                    }
                                                />

                                                <Chip
                                                    label="Reorder"
                                                    color="primary"
                                                    clickable
                                                    onClick={() =>
                                                        console.log("reorder", order.id)
                                                    }
                                                />
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Container>
        </Box>
    );
};

export default Orders;