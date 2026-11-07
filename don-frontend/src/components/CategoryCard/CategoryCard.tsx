import { Card, Typography, Box } from "@mui/material";
import { handleImageError } from "../../utils/image";

type Props = {
    title: string;
    image: string;
    count: number;
    active?: boolean;
    onClick?: () => void;
};

const CategoryCard = ({
    title,
    image,
    count,
    active = false,
    onClick,
}: Props) => {
    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: "pointer",
                position: "relative",
                height: 120,
                borderRadius: 3,
                overflow: "hidden",
                border: active ? "2px solid #111" : "1px solid #e0e0e0",
                transition: "transform 0.25s ease, opacity 0.25s ease",
                boxShadow: active
                    ? "0 10px 25px rgba(0,0,0,0.25)"
                    : "0 2px 8px rgba(0,0,0,0.06)",

                "&:hover": {
                    transform: "translateY(-4px)",
                    /* apply shadow immediately to avoid expensive shadow animation */
                    boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
                },
            }}
        >
            {/* BACKGROUND IMAGE */}
            <Box
                component="img"
                src={image}
                onError={handleImageError}
                alt={title}
                loading="lazy"
                decoding="async"
                sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scale(1.05)",
                }}
            />

            {/* DARK OVERLAY */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)",
                }}
            />

            {/* CONTENT */}
            <Box
                sx={{
                    position: "relative",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    p: 2,
                    color: "#fff",
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        letterSpacing: 0.5,
                        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                >
                    {title}
                </Typography>

                <Typography
                    sx={{
                        fontSize: 12,
                        opacity: 0.9,
                        mt: 0.3,
                    }}
                >
                    {count} items
                </Typography>
            </Box>

            {/* ACTIVE BORDER GLOW */}
            {active && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        border: "2px solid #111",
                        borderRadius: 3,
                        pointerEvents: "none",
                    }}
                />
            )}
        </Card>
    );
};

export default CategoryCard;