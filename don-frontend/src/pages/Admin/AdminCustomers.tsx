import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { MdPeople, MdSearch } from "react-icons/md";
import { getAdminCustomers } from "../../services/adminService";

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const AdminCustomers = () => {
    const { data: customers = [], isLoading, isError } = useQuery({ queryKey: ["adminCustomers"], queryFn: getAdminCustomers, retry: false });
    const [search, setSearch] = useState("");

    const visibleCustomers = useMemo(() => {
        const normalized = search.trim().toLowerCase();
        return (Array.isArray(customers) ? customers : []).filter((customer: any) =>
            !normalized || `${customer.id} ${customer.fullname} ${customer.email}`.toLowerCase().includes(normalized),
        );
    }, [customers, search]);

    return (
        <Stack spacing={2.5}>
            <Box>
                <Typography variant="body2" color="text.secondary">Customer accounts and purchase activity.</Typography>
                <Typography variant="body2" fontWeight={650} sx={{ mt: 0.5 }}>{customers.length} registered customers</Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "8px", borderColor: "#e2e8df" }}>
                <TextField fullWidth size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or customer ID" InputProps={{ startAdornment: <Box sx={{ display: "flex", mr: 1, color: "#718078" }}><MdSearch /></Box> }} />
            </Paper>

            {isLoading ? <Box sx={{ display: "grid", placeItems: "center", py: 9 }}><CircularProgress /></Box> : isError ? (
                <Alert severity="error">Customer data could not be loaded. Check your admin session and backend connection.</Alert>
            ) : (
                <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "#e2e8df", overflow: "hidden" }}>
                    {visibleCustomers.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: "center", bgcolor: "#fafbf9" }}>
                            <Box sx={{ display: "grid", placeItems: "center", mb: 1, color: "#6f8b72", fontSize: 26 }}><MdPeople /></Box>
                            <Typography fontWeight={700}>{customers.length ? "No matching customers" : "No customers yet"}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{customers.length ? "Try searching by a different name, email, or ID." : "Registered customer accounts will appear here."}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table size="small" sx={{ minWidth: 740 }}>
                                <TableHead><TableRow sx={{ bgcolor: "#f7f9f6" }}><TableCell>Customer</TableCell><TableCell>Joined</TableCell><TableCell>Orders</TableCell><TableCell>Lifetime value</TableCell><TableCell>Activity</TableCell></TableRow></TableHead>
                                <TableBody>
                                    {visibleCustomers.map((customer: any) => (
                                        <TableRow key={customer.id} hover>
                                            <TableCell><Typography variant="body2" fontWeight={700}>{customer.fullname}</Typography><Typography variant="caption" color="text.secondary">{customer.email} · ID {customer.id}</Typography></TableCell>
                                            <TableCell>{formatDate(customer.created_at)}</TableCell>
                                            <TableCell>{customer.orderCount}</TableCell>
                                            <TableCell sx={{ fontWeight: 650 }}>₱{Number(customer.lifetimeValue || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell><Chip size="small" label={Number(customer.orderCount) ? "Returning" : "New"} color={Number(customer.orderCount) ? "success" : "default"} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Paper>
            )}
        </Stack>
    );
};

export default AdminCustomers;