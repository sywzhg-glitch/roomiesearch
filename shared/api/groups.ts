import { apiClient } from "./client";
import type { GroupWithMembers, CreateGroupFormData } from "../types";

export const groupsApi = {
  list: async (): Promise<GroupWithMembers[]> => {
    const res = await apiClient.get<{ data: GroupWithMembers[] }>("/api/groups");
    return res.data.data ?? [];
  },

  get: async (groupId: string): Promise<GroupWithMembers> => {
    const res = await apiClient.get<{ data: GroupWithMembers }>(`/api/groups/${groupId}`);
    return res.data.data;
  },

  create: async (body: CreateGroupFormData): Promise<GroupWithMembers> => {
    const res = await apiClient.post<{ data: GroupWithMembers }>("/api/groups", body);
    return res.data.data;
  },

  update: async (groupId: string, body: Partial<CreateGroupFormData>): Promise<GroupWithMembers> => {
    const res = await apiClient.patch<{ data: GroupWithMembers }>(`/api/groups/${groupId}`, body);
    return res.data.data;
  },

  delete: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/api/groups/${groupId}`);
  },

  joinByInviteCode: async (inviteCode: string): Promise<GroupWithMembers> => {
    const res = await apiClient.post<{ data: GroupWithMembers }>(
      `/api/groups/join/${inviteCode}`
    );
    return res.data.data;
  },
};
