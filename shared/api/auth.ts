import { apiClient } from "./client";
import type { MobileUser } from "../types";

export const authApi = {
  /** Mobile login — returns a 30-day JWT */
  login: async (email: string, password: string): Promise<{ token: string; user: MobileUser }> => {
    const res = await apiClient.post<{ token: string; user: MobileUser }>(
      "/api/auth/mobile/token",
      { email, password }
    );
    return res.data;
  },

  /** Register a new user */
  register: async (name: string, email: string, password: string): Promise<{ user: MobileUser }> => {
    const res = await apiClient.post<{ user: MobileUser }>("/api/auth/register", {
      name,
      email,
      password,
    });
    return res.data;
  },
};
