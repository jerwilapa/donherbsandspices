import {
    Autocomplete,
    Box,
    Checkbox,
    FormControlLabel,
    TextField,
    Paper,
    Typography,
    Button,
} from "@mui/material";

import { useEffect, useState } from "react";

import {
    getProvinceOptions,
    getMunicipalityOptions,
    getBarangayOptions,
} from "./addressData";

import { normalizeValue } from "../../helper/normalizeValue";

type Address = {
    fullName: string;
    phone: string;
    addressLine: string;
    province: string;
    municipality: string;
    barangay: string;
    postal: string;
    country: string;
};

type Props = {
    value?: Partial<Address>;
    onChange: (value: Address) => void;

    saveAddress: boolean;
    onSaveAddressChange: (value: boolean) => void;
};

const emptyAddress: Address = {
    fullName: "",
    phone: "",
    addressLine: "",
    province: "",
    municipality: "",
    barangay: "",
    postal: "",
    country: "Philippines",
};

const AddressForm = ({
    value = {},
    onChange,
    saveAddress,
    onSaveAddressChange,
}: Props) => {
    const [mode, setMode] = useState<"saved" | "edit">("saved");
    const [initialized, setInitialized] = useState(false);

    const [form, setForm] = useState<Address>({
        ...emptyAddress,
        ...value,
    });

    const [municipalityOptions, setMunicipalityOptions] = useState<string[]>([]);
    const [barangayOptions, setBarangayOptions] = useState<string[]>([]);

    const provinceOptions = getProvinceOptions();
    // =========================
    // Sync FROM parent (Checkout → Form)
    // =========================
    useEffect(() => {
        if (!value || Object.keys(value).length === 0) return;

        setForm((prev) => ({
            ...prev,
            ...value,
        }));

        setMunicipalityOptions(
            value.province ? getMunicipalityOptions(value.province) : []
        );

        setBarangayOptions(
            value.municipality ? getBarangayOptions(value.municipality) : []
        );

        // only set saved ON FIRST LOAD
        if (!initialized) {
            setMode("saved");
            setInitialized(true);
        }
    }, [value]);

    // =========================
    // Sync TO parent (only edit mode)
    // =========================
    useEffect(() => {
        if (mode !== "edit") return;

        const t = setTimeout(() => {
            onChange(form);
        }, 100);

        return () => clearTimeout(t);
    }, [form, mode]);

    const update = (field: keyof Address, val: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: val,
        }));
    };

    const handleUse = () => {
        setMode("saved");
    };

    const handleEdit = () => {
        setMode("edit");
    };

    // =========================
    // SAVED VIEW
    // =========================
    if (mode === "saved" && form.fullName && form.addressLine) {
        return (
            <Box display="grid" gap={2}>
                <Paper sx={{ p: 2 }}>
                    <Typography fontWeight={600}>
                        Delivery Address
                    </Typography>

                    <Typography>
                        {form.fullName} • {form.phone}
                    </Typography>

                    <Typography>{form.addressLine}</Typography>

                    <Typography>
                        {form.barangay}, {form.municipality}, {form.province}
                    </Typography>

                    <Typography>
                        {form.postal}, {form.country}
                    </Typography>

                    <Box mt={2} display="flex" gap={1}>
                        <Button variant="contained" onClick={handleUse}>
                            Use This Address
                        </Button>

                        <Button onClick={handleEdit}>
                            Change
                        </Button>
                    </Box>
                </Paper>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={saveAddress}
                            onChange={(e) =>
                                onSaveAddressChange(e.target.checked)
                            }
                        />
                    }
                    label="Save this address for future orders"
                />
            </Box>
        );
    }

    // =========================
    // EDIT VIEW
    // =========================
    return (
        <Box display="grid" gap={2}>
            <TextField
                label="Full Name"
                value={normalizeValue(form.fullName)}
                onChange={(e) => update("fullName", e.target.value)}
            />

            <TextField
                label="Phone Number"
                value={normalizeValue(form.phone)}
                onChange={(e) => update("phone", e.target.value)}
            />

            <TextField
                label="House No. / Street"
                value={normalizeValue(form.addressLine)}
                onChange={(e) => update("addressLine", e.target.value)}
            />

            <Autocomplete
                options={provinceOptions}
                value={normalizeValue(form.province)}
                isOptionEqualToValue={(o, v) => o === v}
                onChange={(_, v) => {
                    update("province", v || "");
                    update("municipality", "");
                    update("barangay", "");
                    setMunicipalityOptions(v ? getMunicipalityOptions(v) : []);
                    setBarangayOptions([]);
                }}
                renderInput={(params) => (
                    <TextField {...params} label="Province" />
                )}
            />

            <Autocomplete
                options={municipalityOptions}
                value={normalizeValue(form.municipality)}
                isOptionEqualToValue={(o, v) => o === v}
                onChange={(_, v) => {
                    update("municipality", v || "");
                    update("barangay", "");
                    setBarangayOptions(v ? getBarangayOptions(v) : []);
                }}
                renderInput={(params) => (
                    <TextField {...params} label="Municipality / City" />
                )}
            />

            <Autocomplete
                options={barangayOptions}
                value={normalizeValue(form.barangay)}
                isOptionEqualToValue={(o, v) => o === v}
                onChange={(_, v) => update("barangay", v || "")}
                renderInput={(params) => (
                    <TextField {...params} label="Barangay" />
                )}
            />

            <TextField
                label="Postal Code"
                value={normalizeValue(form.postal)}
                onChange={(e) => update("postal", e.target.value)}
            />

            <TextField
                label="Country"
                value={normalizeValue(form.country)}
                onChange={(e) => update("country", e.target.value)}
            />

            <FormControlLabel
                control={
                    <Checkbox
                        checked={saveAddress}
                        onChange={(e) =>
                            onSaveAddressChange(e.target.checked)
                        }
                    />
                }
                label="Save this address for future orders"
            />
        </Box>
    );
};

export default AddressForm;