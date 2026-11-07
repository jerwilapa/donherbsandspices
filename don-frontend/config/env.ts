const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error("VITE_API_URL must be configured for production builds.");
}

if (import.meta.env.PROD && configuredApiUrl && !configuredApiUrl.startsWith("https://")) {
  throw new Error("VITE_API_URL must use HTTPS in production.");
}

export const API_URL = configuredApiUrl || "http://localhost:5000";
