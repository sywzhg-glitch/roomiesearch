import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "@shared/api/groups";
import { useAuthStore } from "@mobile/store/auth";
import { formatDate, formatPrice, getInitials } from "@shared/lib/utils";
import type { GroupWithMembers } from "@shared/types";
import { Plus, Users, MapPin, DollarSign, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

function GroupCard({ group, onPress }: { group: GroupWithMembers; onPress: () => void }) {
  const copyInvite = async () => {
    await Clipboard.setStringAsync(`roomiesearch://join/${group.inviteCode}`);
    Alert.alert("Copied!", "Invite link copied to clipboard.");
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {group.name}
          </Text>
          {group.location && (
            <View className="flex-row items-center mt-0.5">
              <MapPin size={12} color="#6b7280" />
              <Text className="text-xs text-gray-500 ml-1">{group.location}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={copyInvite}
          className="bg-gray-100 rounded-lg p-2 ml-2"
        >
          <Copy size={14} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center gap-4">
        {(group.budgetMin || group.budgetMax) && (
          <View className="flex-row items-center">
            <DollarSign size={12} color="#4f46e5" />
            <Text className="text-xs text-brand-600 font-medium ml-0.5">
              {group.budgetMin && group.budgetMax
                ? `${formatPrice(group.budgetMin)}–${formatPrice(group.budgetMax)}`
                : group.budgetMax
                ? `Up to ${formatPrice(group.budgetMax)}`
                : formatPrice(group.budgetMin)}
            </Text>
          </View>
        )}
        <View className="flex-row items-center">
          <Users size={12} color="#6b7280" />
          <Text className="text-xs text-gray-500 ml-1">
            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
          </Text>
        </View>
        {(group._count?.listings ?? 0) > 0 && (
          <Text className="text-xs text-gray-500">
            {group._count?.listings} listing{(group._count?.listings ?? 0) !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Member avatars */}
      <View className="flex-row mt-3">
        {group.members.slice(0, 5).map((m, i) => (
          <View
            key={m.userId}
            className="w-7 h-7 rounded-full bg-brand-100 items-center justify-center border-2 border-white"
            style={{ marginLeft: i > 0 ? -8 : 0 }}
          >
            <Text className="text-brand-700 text-xs font-semibold">
              {getInitials(m.user.name ?? "")}
            </Text>
          </View>
        ))}
        {group.members.length > 5 && (
          <View className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center border-2 border-white" style={{ marginLeft: -8 }}>
            <Text className="text-gray-600 text-xs">+{group.members.length - 5}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.list,
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">My Groups</Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Hey {user?.name?.split(" ")[0] ?? "there"} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/groups/new")}
            className="bg-brand-600 rounded-xl px-4 py-2 flex-row items-center gap-2"
          >
            <Plus size={16} color="white" />
            <Text className="text-white font-semibold text-sm">New Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <FlatList
          data={groups ?? []}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4f46e5" />
          }
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push(`/groups/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <View className="w-20 h-20 rounded-full bg-brand-50 items-center justify-center mb-4">
                <Users size={32} color="#4f46e5" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 mb-2">No groups yet</Text>
              <Text className="text-gray-500 text-center px-8 mb-6">
                Create a group to start searching for apartments with your future roommates.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/groups/new")}
                className="bg-brand-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Create your first group</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
