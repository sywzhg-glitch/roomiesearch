import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@shared/api/groups";
import { Users } from "lucide-react-native";

export default function JoinScreen() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => groupsApi.joinByInviteCode(inviteCode),
    onSuccess: (group) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      Alert.alert(
        "Joined!",
        `You've joined "${group.name}".`,
        [{ text: "View Group", onPress: () => router.replace(`/groups/${group.id}`) }]
      );
    },
    onError: (e: any) => {
      Alert.alert("Error", e?.response?.data?.error ?? "Failed to join group.");
      router.replace("/(tabs)");
    },
  });

  return (
    <View className="flex-1 bg-gray-50 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-brand-100 items-center justify-center mb-6">
        <Users size={36} color="#4f46e5" />
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Join Group</Text>
      <Text className="text-gray-500 text-center mb-8">
        You&apos;ve been invited to join a RoomieSearch group.
      </Text>

      <TouchableOpacity
        onPress={() => joinMutation.mutate()}
        disabled={joinMutation.isPending}
        className="bg-brand-600 rounded-xl px-8 py-4 w-full items-center mb-3"
        style={{ opacity: joinMutation.isPending ? 0.7 : 1 }}
      >
        {joinMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Accept Invitation</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
        <Text className="text-gray-500">Decline</Text>
      </TouchableOpacity>
    </View>
  );
}
