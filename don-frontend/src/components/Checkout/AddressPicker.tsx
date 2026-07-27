import { Box, Button, Paper, Typography } from "@mui/material";
import { FaStar } from "react-icons/fa";

type Props = {
    addresses: any[];
    onSelect: (addr: any) => void;
    onAddNew: () => void;
    onSetDefault: (id: number) => void;
};

const AddressPicker = ({
    addresses,
    onSelect,
    onAddNew,
    onSetDefault,
}: Props) => {
    console.log("addresses", addresses);
    return (
        <Box display="grid" gap={2}>
            {addresses.map((addr) => (
                <Paper key={addr.id} sx={{ p: 2 }}>
                    <Typography fontWeight={600}>
                        {addr.fullName} {addr.isDefault && <FaStar color="gold" size="1.1rem" style={{ alignItems: "right" }} />}
                    </Typography>

                    <Typography>{addr.phone}</Typography>
                    <Typography>{addr.addressLine}</Typography>

                    <Typography fontSize={13}>
                        {addr.barangay}, {addr.municipality}, {addr.province}
                    </Typography>

                    <Box mt={1} display="flex" gap={1}>
                        <Button
                            variant="contained"
                            onClick={() => onSelect(addr)}
                        >
                            Use
                        </Button>

                        {!addr.isDefault &&

                            <Button
                                onClick={() => onSetDefault(addr.id)}
                            >
                                Set Default
                            </Button>
                        }
                    </Box>
                </Paper>
            ))}

            <Button variant="outlined" onClick={onAddNew}>
                + Add New Address
            </Button>
        </Box>
    );
};

export default AddressPicker;