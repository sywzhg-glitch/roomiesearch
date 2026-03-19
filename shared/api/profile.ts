import { apiClient } from "./client";
import type { User, ApplicationData } from "../types";

export const profileApi = {
  get: async (): Promise<User & { applicationData?: ApplicationData | null }> => {
    const res = await apiClient.get<{ data: User & { applicationData?: ApplicationData | null } }>(
      "/api/user/profile"
    );
    return res.data.data;
  },

  update: async (data: { name?: string; phone?: string; avatar?: string }) => {
    const res = await apiClient.patch("/api/user/profile", data);
    return res.data.data;
  },
};
