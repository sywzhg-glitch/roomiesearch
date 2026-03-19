import { apiClient } from "./client";
import type { MarketplaceProfileWithDetails, MarketplaceFilters } from "../types";

export const marketplaceApi = {
  list: async (filters?: MarketplaceFilters): Promise<MarketplaceProfileWithDetails[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.location) params.set("location", filters.location);
    if (filters?.budgetMax) params.set("budgetMax", String(filters.budgetMax));

    const res = await apiClient.get<{ data: MarketplaceProfileWithDetails[] }>(
      `/api/marketplace${params.toString() ? `?${params}` : ""}`
    );
    return res.data.data ?? [];
  },

  sendRequest: async (profileId: string, message?: string) => {
    const res = await apiClient.post(`/api/marketplace/${profileId}/request`, { message });
    return res.data.data;
  },
};
