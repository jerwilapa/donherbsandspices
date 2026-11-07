import { useEffect, useState } from "react";
import {
    Container,
    Typography,
    Grid,
    Paper,
    Stack,
    Box,
    Button,
    CircularProgress,
    Divider,
    Snackbar,
    Alert,
} from "@mui/material";

import Navbar from "../../components/Navbar/NavBar";
import AddressForm from "../../components/Checkout/AddressForm";
import DeliveryMethod from "../../components/Checkout/DeliveryMethod";
import AddressPicker from "../../components/Checkout/AddressPicker";
import { MdArrowBack as ArrowBackIcon } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { getCart } from "../../services/cartService";
import { placeOrder } from "../../services/orderService";
import {
    getSavedAddress,
    saveAddress,
    setDefaultAddress,
} from "../../services/addressService";

/* =========================
   Helpers
========================= */
const mapAddress = (addr: any) => ({
    id: addr.id,
    fullName: addr.fullName,
    phone: addr.phone,
    addressLine: addr.addressLine,
    province: addr.province,
    municipality: addr.municipality,
    barangay: addr.barangay,
    postal: addr.postal || "",
    country: addr.country || "Philippines",
    isDefault: addr.isDefault,
});

const mapToBackend = (addr: any, userId: number) => ({
    userId,
    fullName: addr.fullName,
    phone: addr.phone,
    addressLine: addr.addressLine,
    province: addr.province,
    municipality: addr.municipality,
    barangay: addr.barangay,
    postalCode: addr.postal,
    country: addr.country,
});

const Checkout = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [address, setAddress] = useState<any>({});
    const [addresses, setAddresses] = useState<any[]>([]);
    const [addressMode, setAddressMode] = useState<"list" | "form">("list");

    const [hasEditedAddress, setHasEditedAddress] = useState(false);
    const [saveMyAddress, setSaveMyAddress] = useState(true);
    const [delivery, setDelivery] = useState("lalamove");
    const [placing, setPlacing] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    /* =========================
       Load Cart
    ========================= */
    useEffect(() => {
        const loadCart = async () => {
            if (!user?.id) return;

            setLoading(true);
            try {
                const res = await getCart(user.id);
                setCart(res.data);
            } finally {
                setLoading(false);
            }
        };

        loadCart();
    }, []);

    /* =========================
       Load Addresses
    ========================= */
    useEffect(() => {
        const loadAddresses = async () => {
            if (!user?.id) return;

            const res = await getSavedAddress(user.id);
            const formatted = res.data.map(mapAddress);

            setAddresses(formatted);

            const defaultAddr = formatted.find((a: any) => a.isDefault);
            if (defaultAddr) setAddress(defaultAddr);
        };

        loadAddresses();
    }, []);

    /* =========================
       Calculations
    ========================= */
    const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const shipping =
        delivery === "lalamove" ? 200 : delivery === "jnt" ? 150 : 0;

    const total = subtotal + shipping;

    /* =========================
       Set Default Address
    ========================= */
    const handleSetDefault = async (id: number) => {
        try {
            await setDefaultAddress(user.id, id);

            const res = await getSavedAddress(user.id);
            const formatted = res.data.map(mapAddress);

            setAddresses(formatted);

            const defaultAddr = formatted.find((a: any) => a.isDefault);
            if (defaultAddr) setAddress(defaultAddr);

            setSnackbar({
                open: true,
                message: "Default address updated",
                severity: "success",
            });
        } catch {
            setSnackbar({
                open: true,
                message: "Failed to update default address",
                severity: "error",
            });
        }
    };

    /* =========================
       Place Order
    ========================= */
    const handlePlace = async () => {
        if (!user?.id) return navigate("/login");

        if (
            !address.fullName ||
            !address.phone ||
            !address.addressLine
        ) {
            return setSnackbar({
                open: true,
                severity: "error",
                message: "Complete your address",
            });
        }

        setPlacing(true);

        try {
            if (saveMyAddress && hasEditedAddress) {
                await saveAddress(mapToBackend(address, user.id));
            }

            await placeOrder({
                userId: user.id,
                items: cart.map((i) => ({
                    productId: i.product_id,
                    quantity: i.quantity,
                })),
                address,
                deliveryMethod: delivery,
                shipping,
                total,
            });

            window.dispatchEvent(new Event("cartUpdated"));

            setSnackbar({
                open: true,
                severity: "success",
                message: "Order placed!",
            });

            setTimeout(() => navigate("/orders"), 1200);
        } catch {
            setSnackbar({
                open: true,
                severity: "error",
                message: "Order failed",
            });
        } finally {
            setPlacing(false);
        }
    };

    /* =========================
       UI
    ========================= */
    return (
        <>
            <Navbar />

            <Container sx={{ py: 6 }}>
                <Typography variant="h4" fontWeight={700} mb={3}>
                    Checkout
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" mb={2}>
                                Shipping Address
                            </Typography>

                            {addressMode === "list" ? (
                                <AddressPicker
                                    addresses={addresses}
                                    onSelect={(addr) => {
                                        setAddress(addr);
                                        setAddressMode("form");
                                    }}
                                    onAddNew={() => {
                                        setAddress({});
                                        setAddressMode("form");
                                    }}
                                    onSetDefault={handleSetDefault}
                                />
                            ) : (
                                <>
                                    <Button

                                        variant="text"

                                        startIcon={<ArrowBackIcon />}

                                        onClick={() => setAddressMode("list")}

                                        sx={{ mb: 2, fontWeight: 600 }}

                                    >

                                        Back

                                    </Button>

                                    <AddressForm
                                        value={address}
                                        onChange={(val) => {
                                            setHasEditedAddress(true);
                                            setAddress(val);
                                        }}
                                        saveAddress={saveMyAddress}
                                        onSaveAddressChange={
                                            setSaveMyAddress
                                        }
                                    />
                                </>
                            )}
                        </Paper>

                        <Box mt={3}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" mb={2}>
                                    Delivery Method
                                </Typography>

                                <DeliveryMethod
                                    value={delivery}
                                    onChange={setDelivery}
                                />
                            </Paper>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" mb={2}>
                                Order Summary
                            </Typography>

                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <Stack spacing={2}>
                                    {cart.map((item) => (
                                        <Box
                                            key={item.id}
                                            display="flex"
                                            justifyContent="space-between"
                                        >
                                            <Typography>
                                                {item.name} ×{" "}
                                                {item.quantity}
                                            </Typography>

                                            <Typography>
                                                ₱
                                                {(
                                                    item.price *
                                                    item.quantity
                                                ).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}

                                    <Divider />

                                    <Typography>
                                        Subtotal: ₱
                                        {subtotal.toLocaleString()}
                                    </Typography>

                                    <Typography>
                                        Shipping: ₱
                                        {shipping.toLocaleString()}
                                    </Typography>

                                    <Divider />

                                    <Typography fontWeight={700}>
                                        Total: ₱
                                        {total.toLocaleString()}
                                    </Typography>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disabled={placing}
                                        onClick={handlePlace}
                                    >
                                        {placing
                                            ? "Placing..."
                                            : "Place Order"}
                                    </Button>
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() =>
                        setSnackbar((p) => ({ ...p, open: false }))
                    }
                >
                    <Alert severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
};

export default Checkout;