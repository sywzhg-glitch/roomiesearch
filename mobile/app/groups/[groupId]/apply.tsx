import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { applicationsApi } from "@shared/api/applications";
import { useAuthStore } from "@mobile/store/auth";
import { ChevronLeft, Save, Check } from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function ApplyScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: appData, refetch } = useQuery({
    queryKey: ["app-data", groupId],
    queryFn: () => applicationsApi.getForGroup(groupId),
  });

  const currentUserId = user?.id ?? "";
  const myMemberData = appData?.find((m: any) => m.userId === currentUserId);
  const myApp = myMemberData?.user?.applicationData;

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: user?.email ?? "",
    phone: "", currentAddress: "", income: "", employer: "",
    jobTitle: "", employmentYears: "", creditScore: "",
  });

  useEffect(() => {
    if (myApp) {
      setForm({
        firstName: myApp.firstName ?? "",
        lastName: myApp.lastName ?? "",
        email: myApp.email ?? user?.email ?? "",
        phone: myApp.phone ?? "",
        currentAddress: myApp.currentAddress ?? "",
        income: myApp.income?.toString() ?? "",
        employer: myApp.employer ?? "",
        jobTitle: myApp.jobTitle ?? "",
        employmentYears: myApp.employmentYears?.toString() ?? "",
        creditScore: myApp.creditScore?.toString() ?? "",
      });
    }
  }, [myApp?.firstName]);

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function saveInfo() {
    setSaving(true);
    try {
      await applicationsApi.save(groupId, {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        currentAddress: form.currentAddress || undefined,
        income: form.income ? parseInt(form.income) : undefined,
        employer: form.employer || undefined,
        jobTitle: form.jobTitle || undefined,
        employmentYears: form.employmentYears ? parseInt(form.employmentYears) : undefined,
        creditScore: form.creditScore ? parseInt(form.creditScore) : undefined,
      });
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      Alert.alert("Error", "Failed to save your information.");
    } finally {
      setSaving(false);
    }
  }

  async function generatePDF() {
    if (!appData) return;
    setGenerating(true);
    try {
      const applicants = appData
        .filter((m: any) => m.user?.applicationData)
        .map((m: any) => m.user.applicationData);

      if (applicants.length === 0) {
        Alert.alert("No data", "At least one member needs to fill in their info first.");
        return;
      }

      const html = `
        <html><head><meta charset="utf-8">
        <style>body{font-family:sans-serif;padding:24px;color:#111}h1{color:#4f46e5}h2{color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:8px;border-bottom:1px solid #f3f4f6}th{color:#6b7280;font-weight:600;font-size:12px}</style>
        </head><body>
        <h1>Rental Application</h1>
        <p>Generated ${new Date().toLocaleDateString()}</p>
        ${applicants.map((a: any) => `
          <h2>${a.firstName ?? ""} ${a.lastName ?? ""}</h2>
          <table>
            <tr><th>Email</th><td>${a.email ?? "—"}</td></tr>
            <tr><th>Phone</th><td>${a.phone ?? "—"}</td></tr>
            <tr><th>Address</th><td>${a.currentAddress ?? "—"}</td></tr>
            <tr><th>Employer</th><td>${a.employer ?? "—"}</td></tr>
            <tr><th>Job Title</th><td>${a.jobTitle ?? "—"}</td></tr>
            <tr><th>Annual Income</th><td>${a.income ? `$${a.income.toLocaleString()}` : "—"}</td></tr>
            <tr><th>Credit Score</th><td>${a.creditScore ?? "—"}</td></tr>
          </table>
        `).join("")}
        </body></html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      } else {
        Alert.alert("PDF Generated", `Saved to: ${uri}`);
      }
    } catch {
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setGenerating(false);
    }
  }

  const readyCount = appData?.filter((m: any) => m.user?.applicationData).length ?? 0;
  const totalCount = appData?.length ?? 0;

  const Field = ({ label, placeholder, field, keyboardType = "default" }: any) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
        placeholder={placeholder}
        value={(form as any)[field]}
        onChangeText={(v: string) => update(field, v)}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1 mr-2">
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Application</Text>
        </View>
        <TouchableOpacity
          onPress={generatePDF}
          disabled={generating}
          className="bg-brand-600 rounded-xl px-4 py-2"
          style={{ opacity: generating ? 0.7 : 1 }}
        >
          {generating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-sm">Export PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Team readiness */}
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-700">Team readiness</Text>
            <Text className="text-sm font-bold text-brand-600">{readyCount}/{totalCount} ready</Text>
          </View>
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-2 bg-brand-600 rounded-full"
              style={{ width: totalCount > 0 ? `${(readyCount / totalCount) * 100}%` : "0%" }}
            />
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">Personal Information</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="First name" placeholder="Alice" field="firstName" />
            </View>
            <View className="flex-1">
              <Field label="Last name" placeholder="Chen" field="lastName" />
            </View>
          </View>
          <Field label="Email" placeholder="alice@example.com" field="email" keyboardType="email-address" />
          <Field label="Phone" placeholder="415-555-0100" field="phone" keyboardType="phone-pad" />
          <Field label="Current address" placeholder="123 Main St, SF CA" field="currentAddress" />

          <View className="h-px bg-gray-100 my-2" />
          <Text className="text-sm font-semibold text-gray-700 mb-4 mt-2">Employment & Income</Text>

          <Field label="Employer" placeholder="TechCorp Inc" field="employer" />
          <Field label="Job title" placeholder="Software Engineer" field="jobTitle" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Annual income ($)" placeholder="120000" field="income" keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <Field label="Years at job" placeholder="3" field="employmentYears" keyboardType="number-pad" />
            </View>
          </View>
          <Field label="Credit score" placeholder="750" field="creditScore" keyboardType="number-pad" />
        </View>

        <TouchableOpacity
          onPress={saveInfo}
          disabled={saving}
          className="bg-brand-600 rounded-xl py-4 flex-row items-center justify-center gap-2 mb-8"
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : saved ? (
            <>
              <Check size={18} color="white" />
              <Text className="text-white font-semibold">Saved!</Text>
            </>
          ) : (
            <>
              <Save size={18} color="white" />
              <Text className="text-white font-semibold">Save My Info</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
