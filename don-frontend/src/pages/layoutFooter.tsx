import { Box } from "@mui/material";
import Footer from "../components/Footer/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
            }}
        >

            {/* MAIN CONTENT */}
            <Box sx={{ flex: 1 }}>
                {children}
            </Box>

            <Footer />
        </Box>
    );
};

export default Layout;