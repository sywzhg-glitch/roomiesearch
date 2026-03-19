import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { profileApi } from "@shared/api/profile";
import { useAuthStore } from "@mobile/store/auth";
import { getInitials } from "@shared/lib/utils";
import { User, Phone, LogOut, Save } from "lucide-react-native";

export default function ProfileScreen() {
  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const storeUser = useAuthStore((s) => s.user);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone((profile as any).phone ?? "");
    }
  }, [profile?.name]);

  const updateMutation = useMutation({
    mutationFn: () => profileApi.update({ name: name.trim(), phone: phone.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      Alert.alert("Saved!", "Your profile has been updated.");
    },
    onError: () => Alert.alert("Error", "Failed to update profile."),
  });

  function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => clearAuth(),
      },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-5 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-4">Profile</Text>

        {/* Avatar */}
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-brand-100 items-center justify-center mb-3">
            <Text className="text-brand-700 text-2xl font-bold">
              {getInitials(profile?.name ?? storeUser?.name ?? "?")}
            </Text>
          </View>
          <Text className="text-lg font-semibold text-gray-900">
            {profile?.name ?? storeUser?.name}
          </Text>
          <Text className="text-gray-500 text-sm">{profile?.email ?? storeUser?.email}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Edit profile */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">Edit Profile</Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Full name</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 px-4">
              <User size={16} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 ml-2 text-gray-900"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-1">Phone</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 px-4">
              <Phone size={16} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 ml-2 text-gray-900"
                value={phone}
                onChangeText={setPhone}
                placeholder="415-555-0100"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-brand-600 rounded-xl py-3.5 flex-row items-center justify-center gap-2"
            style={{ opacity: updateMutation.isPending ? 0.7 : 1 }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Save size={16} color="white" />
                <Text className="text-white font-semibold">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Account info */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Account</Text>
          <View className="flex-row justify-between py-2 border-b border-gray-100">
            <Text className="text-gray-500">Email</Text>
            <Text className="text-gray-900 font-medium">{profile?.email}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Member since</Text>
            <Text className="text-gray-900 font-medium">
              {profile?.createdAt
                ? new Date(profile.createdAt as string).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "—"}
            </Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white border border-red-200 rounded-2xl py-4 flex-row items-center justify-center gap-2"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-600 font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
