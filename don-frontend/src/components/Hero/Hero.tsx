import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Hero = () => {
    const navigate = useNavigate();
    return (
        <Box
            sx={{
                height: 520,
                background: "linear-gradient(180deg, #ffffff 0%, #f6f6f6 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                textAlign: "center",
                px: 2,
                borderBottom: "1px solid #e5e5e5"
            }}
        >
            <Typography
                variant="h1"
                sx={{
                    fontFamily: '"Imprint MT Shadow", serif',
                    fontWeight: 400,
                    letterSpacing: 1.5,
                    color: "#111",
                    fontSize: { xs: 38, md: 96 }
                }}
            >
                DON' Herbs & Spices
            </Typography>

            <Typography
                mt={2}
                sx={{
                    fontSize: 18,
                    color: "#555",
                    maxWidth: 500
                }}
            >
                Premium herbs, spices, and healthy essentials delivered to your home.
            </Typography>

            <Button
                variant="contained"
                sx={{
                    mt: 4,
                    px: 5,
                    py: 1.5,
                    borderRadius: 3,
                    backgroundColor: "#111",
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                        backgroundColor: "#333"
                    }
                }}
                onClick={() =>
                    navigate(`/products`)
                }
            >
                Shop Now
            </Button>
        </Box>
    );
};

export default Hero;