import { Avatar, Box, Button, Divider, List, ListItemButton, Stack, Typography } from "@mui/material";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MdCategory, MdDashboard, MdInventory2, MdLogout, MdPeople, MdShoppingBag, MdStorefront } from "react-icons/md";

const sections = [
  { label: "Overview", to: "/admin", icon: MdDashboard, end: true },
  { label: "Orders", to: "/admin/orders", icon: MdShoppingBag },
  { label: "Customers", to: "/admin/customers", icon: MdPeople },
  { label: "Products", to: "/admin/products", icon: MdInventory2 },
  { label: "Categories", to: "/admin/categories", icon: MdCategory },
];

const pageTitles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  let user: { fullname?: string; email?: string } | null = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const title = pageTitles[location.pathname] || "Admin";
  const initials = (user?.fullname || user?.email || "Admin")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login");
  };

  const navList = (mobile = false) => (
    <List disablePadding sx={{ display: mobile ? "flex" : "grid", gap: 0.5 }}>
      {sections.map(({ label, to, icon: Icon, end }) => (
        <ListItemButton
          key={to}
          component={NavLink}
          to={to}
          end={end}
          sx={{
            minHeight: 42,
            px: 1.5,
            gap: 1.25,
            flex: mobile ? "0 0 auto" : undefined,
            borderRadius: "6px",
            color: "#53645a",
            textDecoration: "none",
            "&.active": { color: "#173d2d", backgroundColor: "#e5eee5", fontWeight: 700 },
            "&:hover": { backgroundColor: "#edf2ec" },
          }}
        >
          <Icon size={19} />
          <Typography component="span" variant="body2" fontWeight="inherit" whiteSpace="nowrap">
            {label}
          </Typography>
        </ListItemButton>
      ))}
    </List>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#f4f6f2", color: "#17241c" }}>
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "flex" },
          width: 238,
          flex: "0 0 238px",
          flexDirection: "column",
          px: 2,
          py: 2.5,
          bgcolor: "#fff",
          borderRight: "1px solid #e3e9e2",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 1, mb: 4 }}>
          <Box sx={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "7px", bgcolor: "#173d2d", color: "#e6f18a", fontSize: 17, fontWeight: 800 }}>
            D
          </Box>
          <Box>
            <Typography fontWeight={800} lineHeight={1.15}>DON&apos;</Typography>
            <Typography variant="caption" color="text.secondary">STORE ADMIN</Typography>
          </Box>
        </Stack>

        <Typography variant="overline" sx={{ px: 1.5, mb: 1, color: "#849188", fontWeight: 700 }}>
          WORKSPACE
        </Typography>
        {navList()}

        <Box sx={{ flex: 1 }} />
        <Divider sx={{ my: 1.5 }} />
        <Button
          component={NavLink}
          to="/"
          startIcon={<MdStorefront />}
          sx={{ justifyContent: "flex-start", color: "#53645a", textTransform: "none" }}
        >
          View storefront
        </Button>
        <Button
          onClick={logout}
          startIcon={<MdLogout />}
          sx={{ justifyContent: "flex-start", color: "#53645a", textTransform: "none" }}
        >
          Sign out
        </Button>
      </Box>

      <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            bgcolor: "rgba(255,255,255,0.96)",
            borderBottom: "1px solid #e3e9e2",
            backdropFilter: "blur(12px)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: { xs: 2, md: 4 }, py: 1.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "#748279", letterSpacing: 0.4 }}>ADMINISTRATION</Typography>
              <Typography variant="h6" fontWeight={750} lineHeight={1.25}>{title}</Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
                <Typography variant="body2" fontWeight={650}>{user?.fullname || "Administrator"}</Typography>
                <Typography variant="caption" color="text.secondary">Store manager</Typography>
              </Box>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "#dce9cb", color: "#24452f", fontSize: 13, fontWeight: 700 }}>{initials}</Avatar>
            </Stack>
          </Stack>
          <Box sx={{ display: { xs: "block", md: "none" }, px: 1.5, pb: 1, overflowX: "auto" }}>
            {navList(true)}
          </Box>
        </Box>

        <Box component="main" sx={{ width: "100%", maxWidth: 1440, mx: "auto", p: { xs: 2, sm: 3, lg: 4 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;