import { apiClient } from "./client";

export interface ApplicationFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentAddress?: string;
  income?: number;
  employer?: string;
  jobTitle?: string;
  employmentYears?: number;
  creditScore?: number;
  hasGuarantor?: boolean;
  guarantorName?: string;
  guarantorEmail?: string;
  guarantorPhone?: string;
  guarantorIncome?: number;
}

export const applicationsApi = {
  getForGroup: async (groupId: string) => {
    const res = await apiClient.get(`/api/applications/${groupId}`);
    return res.data.data;
  },

  save: async (groupId: string, data: ApplicationFormData) => {
    const res = await apiClient.post(`/api/applications/${groupId}`, data);
    return res.data.data;
  },
};
