import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#ffffff",
      paper: "#fafafa",
    },
    primary: {
      main: "#111111",
    },
    text: {
      primary: "#111111",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    fontSize: 14,
    h1: {
      fontSize: "2rem",
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontSize: "1.75rem",
      lineHeight: 1.25,
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h3: {
      fontSize: "1.5rem",
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontSize: "1.375rem",
      lineHeight: 1.35,
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h5: {
      fontSize: "1.125rem",
      lineHeight: 1.4,
      fontWeight: 700,
    },
    h6: {
      fontSize: "1rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    subtitle1: {
      fontSize: "0.9375rem",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.8125rem",
      lineHeight: 1.45,
      fontWeight: 600,
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.8125rem",
      lineHeight: 1.4,
      fontWeight: 600,
      textTransform: "none",
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.45,
    },
    overline: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      fontWeight: 600,
      letterSpacing: "0.06em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: "16px",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          fontSize: "0.875rem",
          lineHeight: 1.5,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
        },
      },
    },
  },
  shape: {
    borderRadius: 10,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);