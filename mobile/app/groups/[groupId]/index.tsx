import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView, Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "@shared/api/listings";
import { groupsApi } from "@shared/api/groups";
import { useAuthStore } from "@mobile/store/auth";
import { formatPrice, getInitials } from "@shared/lib/utils";
import { rankListings, getScoreLabel } from "@shared/lib/ranking";
import type { GroupListingWithDetails } from "@shared/types";
import {
  ChevronLeft, Star, MapPin, BedDouble, Bath,
  Plus, Users, FileText, Sparkles
} from "lucide-react-native";

function ListingCard({
  item,
  currentUserId,
  onPress,
}: {
  item: GroupListingWithDetails & { rank: number; score: number };
  currentUserId: string;
  onPress: () => void;
}) {
  const myRating = item.ratings.find((r) => r.userId === currentUserId);
  const avgRating = item.avgRating ?? 0;
  const scoreLabel = getScoreLabel(item.score);
  const scoreBg =
    item.score >= 80 ? "bg-green-100" :
    item.score >= 60 ? "bg-blue-100" :
    item.score >= 40 ? "bg-yellow-100" : "bg-gray-100";
  const scoreText =
    item.score >= 80 ? "text-green-700" :
    item.score >= 60 ? "text-blue-700" :
    item.score >= 40 ? "text-yellow-700" : "text-gray-500";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-gray-100"
    >
      {/* Image */}
      {item.listing.images?.[0] ? (
        <Image
          source={{ uri: item.listing.images[0] }}
          className="w-full h-40"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-32 bg-brand-50 items-center justify-center">
          <Text className="text-5xl">🏠</Text>
        </View>
      )}

      <View className="p-4">
        {/* Price + score */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xl font-bold text-gray-900">
            {formatPrice(item.listing.price)}<Text className="text-sm font-normal text-gray-500">/mo</Text>
          </Text>
          <View className={`px-2.5 py-1 rounded-full ${scoreBg}`}>
            <Text className={`text-xs font-semibold ${scoreText}`}>{scoreLabel}</Text>
          </View>
        </View>

        {/* Address */}
        {item.listing.address && (
          <View className="flex-row items-center mb-2">
            <MapPin size={13} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1" numberOfLines={1}>
              {item.listing.address}{item.listing.city ? `, ${item.listing.city}` : ""}
            </Text>
          </View>
        )}

        {/* Specs */}
        <View className="flex-row items-center gap-4 mb-3">
          {item.listing.beds != null && (
            <View className="flex-row items-center">
              <BedDouble size={13} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">{item.listing.beds} bed</Text>
            </View>
          )}
          {item.listing.baths != null && (
            <View className="flex-row items-center">
              <Bath size={13} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">{item.listing.baths} bath</Text>
            </View>
          )}
          {item.listing.sqft && (
            <Text className="text-sm text-gray-500">{item.listing.sqft.toLocaleString()} sqft</Text>
          )}
        </View>

        {/* Ratings row */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Star size={14} color={avgRating > 0 ? "#f59e0b" : "#d1d5db"} fill={avgRating > 0 ? "#f59e0b" : "none"} />
            <Text className="text-sm font-medium text-gray-700 ml-1">
              {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"}
            </Text>
            {item.ratings.length > 0 && (
              <Text className="text-xs text-gray-400 ml-1">({item.ratings.length})</Text>
            )}
          </View>
          {myRating && (
            <Text className="text-xs text-brand-600 font-medium">
              You: {myRating.rating}★
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.get(groupId),
  });

  const { data: rawListings, isLoading, refetch } = useQuery({
    queryKey: ["listings", groupId],
    queryFn: () => listingsApi.getForGroup(groupId),
    enabled: !!groupId,
  });

  const memberCount = group?.members.length ?? 0;
  const ranked = rawListings ? rankListings(rawListings, memberCount) : [];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push(`/groups/${groupId}/apply`)}
              className="bg-gray-100 rounded-xl px-3 py-2 flex-row items-center gap-1.5"
            >
              <FileText size={14} color="#374151" />
              <Text className="text-sm font-medium text-gray-700">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-xl font-bold text-gray-900 mt-1" numberOfLines={1}>
          {group?.name ?? "Loading..."}
        </Text>
        {group?.location && (
          <View className="flex-row items-center mt-0.5">
            <MapPin size={12} color="#6b7280" />
            <Text className="text-sm text-gray-500 ml-1">{group.location}</Text>
          </View>
        )}

        {/* Member list */}
        <View className="flex-row items-center mt-3 gap-1.5">
          <Users size={13} color="#6b7280" />
          <View className="flex-row">
            {group?.members.slice(0, 4).map((m, i) => (
              <View
                key={m.userId}
                className="w-6 h-6 rounded-full bg-brand-100 items-center justify-center border-2 border-white"
                style={{ marginLeft: i > 0 ? -6 : 0 }}
              >
                <Text className="text-brand-700 text-xs font-semibold" style={{ fontSize: 9 }}>
                  {getInitials(m.user.name ?? "")}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-xs text-gray-500">{memberCount} members</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4f46e5" size="large" />
        </View>
      ) : (
        <FlatList
          data={ranked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#4f46e5" />
          }
          renderItem={({ item }) => (
            <ListingCard
              item={item}
              currentUserId={user?.id ?? ""}
              onPress={() => router.push(`/listings/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-5xl mb-4">🏠</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">No listings yet</Text>
              <Text className="text-gray-500 text-center px-8">
                Listings added on the web will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
