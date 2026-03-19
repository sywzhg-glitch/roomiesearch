import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@shared/api/groups";
import { ChevronLeft } from "lucide-react-native";

export default function NewGroupScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", location: "", budgetMin: "", budgetMax: "",
    bedsMin: "", bedsMax: "", notes: "",
  });

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      Alert.alert("Error", "Group name is required.");
      return;
    }
    setLoading(true);
    try {
      await groupsApi.create({
        name: form.name.trim(),
        location: form.location || undefined,
        budgetMin: form.budgetMin ? parseInt(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? parseInt(form.budgetMax) : undefined,
        bedsMin: form.bedsMin ? parseInt(form.bedsMin) : undefined,
        bedsMax: form.bedsMax ? parseInt(form.bedsMax) : undefined,
        notes: form.notes || undefined,
      });
      await qc.invalidateQueries({ queryKey: ["groups"] });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.error ?? "Failed to create group.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-2">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">New Group</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">Group Details</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Group name *</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="SF Roomies"
              value={form.name}
              onChangeText={(v) => update("name", v)}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Location</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="San Francisco, CA"
              value={form.location}
              onChangeText={(v) => update("location", v)}
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Budget min ($)</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="2000"
                keyboardType="number-pad"
                value={form.budgetMin}
                onChangeText={(v) => update("budgetMin", v)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Budget max ($)</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="4000"
                keyboardType="number-pad"
                value={form.budgetMax}
                onChangeText={(v) => update("budgetMax", v)}
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Min beds</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="2"
                keyboardType="number-pad"
                value={form.bedsMin}
                onChangeText={(v) => update("bedsMin", v)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Max beds</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="4"
                keyboardType="number-pad"
                value={form.bedsMax}
                onChangeText={(v) => update("bedsMax", v)}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
              placeholder="Any requirements or notes for your group..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={form.notes}
              onChangeText={(v) => update("notes", v)}
              style={{ minHeight: 80 }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading}
          className="bg-brand-600 rounded-xl py-4 items-center"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Create Group</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
