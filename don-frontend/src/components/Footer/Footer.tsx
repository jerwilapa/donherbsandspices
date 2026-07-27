import { Box, Typography } from "@mui/material";

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                py: 4,
                bgcolor: "#111",
                color: "#fff",
                textAlign: "center",
            }}
        >
            <Typography>
                © 2026 DonHerbsAndSpices. All Rights Reserved.
            </Typography>
        </Box>
    );
};

export default Footer;