import { Box, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { useState, useEffect } from "react";

type Props = {
    value?: string;
    onChange: (v: string) => void;
};

const methods = [
    { id: "lalamove", label: "Lalamove", cost: 200 },
    { id: "jnt", label: "J&T Express", cost: 150 },
    { id: "pickup", label: "Pickup", cost: 0 },
];

const DeliveryMethod = ({ value = "lalamove", onChange }: Props) => {
    const [selected, setSelected] = useState(value);

    useEffect(() => onChange(selected), [selected]);

    return (
        <Box>
            <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
                {methods.map((m) => (
                    <FormControlLabel
                        key={m.id}
                        value={m.id}
                        control={<Radio />}
                        label={`${m.label} ${m.cost ? `(₱${m.cost})` : "(Free)"}`}
                    />
                ))}
            </RadioGroup>
        </Box>
    );
};

export default DeliveryMethod;
