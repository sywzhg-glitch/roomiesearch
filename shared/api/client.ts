import axios from "axios";

// EXPO_PUBLIC_API_URL is set in mobile/.env
// - iOS Simulator: http://localhost:3000
// - Android Emulator: http://10.0.2.2:3000
// - Physical device: http://<your-mac-lan-ip>:3000
// - Production: https://your-domain.com
const BASE_URL =
  (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL) ??
  "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export function setAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
}
