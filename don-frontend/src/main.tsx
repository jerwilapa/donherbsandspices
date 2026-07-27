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