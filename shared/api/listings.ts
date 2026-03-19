import { apiClient } from "./client";
import type { GroupListingWithDetails, AddListingFormData, ListingRating } from "../types";

export const listingsApi = {
  getForGroup: async (groupId: string): Promise<GroupListingWithDetails[]> => {
    const res = await apiClient.get<{ data: GroupListingWithDetails[] }>(
      `/api/groups/${groupId}/listings`
    );
    return res.data.data ?? [];
  },

  get: async (groupListingId: string): Promise<GroupListingWithDetails> => {
    const res = await apiClient.get<{ data: GroupListingWithDetails }>(
      `/api/listings/${groupListingId}`
    );
    return res.data.data;
  },

  add: async (groupId: string, body: AddListingFormData): Promise<GroupListingWithDetails> => {
    const res = await apiClient.post<{ data: GroupListingWithDetails }>(
      `/api/groups/${groupId}/listings`,
      body
    );
    return res.data.data;
  },

  updateStatus: async (
    groupListingId: string,
    status: "CONSIDERING" | "APPLYING" | "APPLIED" | "REJECTED" | "SIGNED"
  ): Promise<GroupListingWithDetails> => {
    const res = await apiClient.patch<{ data: GroupListingWithDetails }>(
      `/api/listings/${groupListingId}`,
      { status }
    );
    return res.data.data;
  },

  remove: async (groupListingId: string): Promise<void> => {
    await apiClient.delete(`/api/listings/${groupListingId}`);
  },
};

export const ratingsApi = {
  upsert: async (
    groupListingId: string,
    data: { rating?: number; interested?: boolean; applying?: boolean }
  ): Promise<ListingRating> => {
    const res = await apiClient.patch<{ data: ListingRating }>(
      `/api/listings/${groupListingId}/ratings`,
      data
    );
    return res.data.data;
  },
};

export const commentsApi = {
  post: async (
    groupListingId: string,
    content: string,
    parentId?: string
  ) => {
    const res = await apiClient.post(`/api/listings/${groupListingId}/comments`, {
      content,
      parentId,
    });
    return res.data.data;
  },
};
