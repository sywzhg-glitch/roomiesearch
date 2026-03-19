import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput, Alert
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { marketplaceApi } from "@shared/api/marketplace";
import { formatPrice, formatDate, getInitials } from "@shared/lib/utils";
import type { MarketplaceProfileWithDetails, MarketplaceType } from "@shared/types";
import { MapPin, DollarSign, Users, Home, Search } from "lucide-react-native";

const TYPE_LABELS: Record<MarketplaceType, string> = {
  OPEN_ROOM: "Open Room",
  LOOKING_FOR_GROUP: "Looking for Group",
  LOOKING_TO_JOIN: "Looking to Join",
};

const TYPE_COLORS: Record<MarketplaceType, string> = {
  OPEN_ROOM: "bg-green-100 text-green-700",
  LOOKING_FOR_GROUP: "bg-blue-100 text-blue-700",
  LOOKING_TO_JOIN: "bg-purple-100 text-purple-700",
};

function ProfileCard({ profile, onConnect }: { profile: MarketplaceProfileWithDetails; onConnect: () => void }) {
  const [colors, textColor] = (TYPE_COLORS[profile.type] || "bg-gray-100 text-gray-700").split(" ");

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-12 h-12 rounded-full bg-brand-100 items-center justify-center mr-3">
            <Text className="text-brand-700 font-bold text-base">
              {getInitials(profile.user?.name ?? profile.group?.name ?? "?")}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900" numberOfLines={1}>
              {profile.user?.name ?? profile.group?.name ?? "Anonymous"}
            </Text>
            <View className={`self-start mt-1 px-2 py-0.5 rounded-full ${colors}`}>
              <Text className={`text-xs font-medium ${textColor}`}>
                {TYPE_LABELS[profile.type]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text className="text-base font-semibold text-gray-900 mb-1">{profile.title}</Text>
      {profile.description && (
        <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{profile.description}</Text>
      )}

      <View className="flex-row flex-wrap gap-3 mb-3">
        {profile.location && (
          <View className="flex-row items-center">
            <MapPin size={12} color="#6b7280" />
            <Text className="text-xs text-gray-500 ml-1">{profile.location}</Text>
          </View>
        )}
        {(profile.budgetMin || profile.budgetMax) && (
          <View className="flex-row items-center">
            <DollarSign size={12} color="#4f46e5" />
            <Text className="text-xs text-brand-600 font-medium ml-0.5">
              {profile.budgetMin && profile.budgetMax
                ? `${formatPrice(profile.budgetMin)}–${formatPrice(profile.budgetMax)}`
                : profile.budgetMax
                ? `Up to ${formatPrice(profile.budgetMax)}`
                : formatPrice(profile.budgetMin)}
            </Text>
          </View>
        )}
        {profile.moveInDate && (
          <Text className="text-xs text-gray-500">Move in {formatDate(profile.moveInDate)}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={onConnect}
        className="bg-brand-600 rounded-xl py-2.5 items-center"
      >
        <Text className="text-white font-semibold text-sm">Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MarketplaceScreen() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<MarketplaceType | undefined>();

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["marketplace", typeFilter],
    queryFn: () => marketplaceApi.list({ type: typeFilter }),
  });

  const connectMutation = useMutation({
    mutationFn: (profileId: string) => marketplaceApi.sendRequest(profileId, "Hi, I'd love to connect!"),
    onSuccess: () => Alert.alert("Request Sent!", "They'll be notified of your interest."),
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.error ?? "Failed to send request."),
  });

  const filtered = profiles?.filter((p) =>
    !search ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.location?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-3">Marketplace</Text>

        {/* Search */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Search size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search by location or title..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Type filters */}
        <View className="flex-row gap-2">
          {([undefined, "OPEN_ROOM", "LOOKING_FOR_GROUP", "LOOKING_TO_JOIN"] as (MarketplaceType | undefined)[]).map((t) => (
            <TouchableOpacity
              key={t ?? "all"}
              onPress={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full ${typeFilter === t ? "bg-brand-600" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-medium ${typeFilter === t ? "text-white" : "text-gray-600"}`}>
                {t ? TYPE_LABELS[t] : "All"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4f46e5" />
          }
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              onConnect={() => connectMutation.mutate(item.id)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Home size={48} color="#d1d5db" />
              <Text className="text-lg font-semibold text-gray-900 mt-4 mb-2">No listings found</Text>
              <Text className="text-gray-500 text-center px-8">
                Try adjusting your filters.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
