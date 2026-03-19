import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listingsApi, ratingsApi, commentsApi } from "@shared/api/listings";
import { useAuthStore } from "@mobile/store/auth";
import { formatPrice, formatRelativeTime, getInitials } from "@shared/lib/utils";
import {
  ChevronLeft, Star, MapPin, BedDouble, Bath,
  Heart, Send, MessageSquare, ExternalLink
} from "lucide-react-native";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} hitSlop={8}>
          <Star
            size={28}
            color={s <= value ? "#f59e0b" : "#d1d5db"}
            fill={s <= value ? "#f59e0b" : "none"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ListingDetailScreen() {
  const { groupListingId } = useLocalSearchParams<{ groupListingId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: gl, isLoading } = useQuery({
    queryKey: ["listing", groupListingId],
    queryFn: () => listingsApi.get(groupListingId),
  });

  const myRating = gl?.ratings.find((r) => r.userId === user?.id);

  const rateMutation = useMutation({
    mutationFn: (data: { rating?: number; interested?: boolean; applying?: boolean }) =>
      ratingsApi.upsert(groupListingId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listing", groupListingId] }),
  });

  async function submitComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await commentsApi.post(groupListingId, comment.trim());
      setComment("");
      qc.invalidateQueries({ queryKey: ["listing", groupListingId] });
    } catch {
      Alert.alert("Error", "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#4f46e5" size="large" />
      </View>
    );
  }

  if (!gl) return null;

  const avgRating = gl.avgRating ?? 0;
  const totalRatings = gl.ratings.filter((r) => r.rating > 0).length;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-3 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1 mr-2">
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 flex-1" numberOfLines={1}>
          {gl.listing.address ?? "Listing Detail"}
        </Text>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Images */}
        {gl.listing.images?.[0] ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-56">
            {gl.listing.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} className="h-56 w-80 mr-1" resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View className="h-48 bg-brand-50 items-center justify-center">
            <Text className="text-6xl">🏠</Text>
          </View>
        )}

        <View className="px-4 py-5">
          {/* Price + status */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-2xl font-bold text-gray-900">
              {formatPrice(gl.listing.price)}
              <Text className="text-base font-normal text-gray-500">/mo</Text>
            </Text>
            <View className="bg-gray-100 px-3 py-1 rounded-full">
              <Text className="text-sm font-medium text-gray-600">{gl.status}</Text>
            </View>
          </View>

          {/* Address */}
          {gl.listing.address && (
            <View className="flex-row items-center mb-2">
              <MapPin size={15} color="#6b7280" />
              <Text className="text-gray-600 ml-1">
                {gl.listing.address}{gl.listing.city ? `, ${gl.listing.city}` : ""}{gl.listing.state ? `, ${gl.listing.state}` : ""}
              </Text>
            </View>
          )}

          {/* Specs */}
          <View className="flex-row gap-5 mb-4">
            {gl.listing.beds != null && (
              <View className="flex-row items-center">
                <BedDouble size={15} color="#4f46e5" />
                <Text className="text-gray-700 ml-1 font-medium">{gl.listing.beds} bed</Text>
              </View>
            )}
            {gl.listing.baths != null && (
              <View className="flex-row items-center">
                <Bath size={15} color="#4f46e5" />
                <Text className="text-gray-700 ml-1 font-medium">{gl.listing.baths} bath</Text>
              </View>
            )}
            {gl.listing.sqft && (
              <Text className="text-gray-700 font-medium">{gl.listing.sqft.toLocaleString()} sqft</Text>
            )}
          </View>

          {/* Group avg rating */}
          <View className="flex-row items-center mb-5 pb-5 border-b border-gray-100">
            <Star size={16} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-gray-700 ml-1 font-medium">
              {avgRating > 0 ? `${avgRating.toFixed(1)} avg` : "No ratings yet"}
            </Text>
            {totalRatings > 0 && (
              <Text className="text-gray-400 text-sm ml-1">({totalRatings} ratings)</Text>
            )}
            <View className="flex-row items-center ml-4">
              <Heart size={14} color="#ef4444" />
              <Text className="text-gray-600 text-sm ml-1">{gl.interestedCount} interested</Text>
            </View>
          </View>

          {/* My rating */}
          <View className="bg-brand-50 rounded-2xl p-4 mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-3">Your rating</Text>
            <StarRating
              value={myRating?.rating ?? 0}
              onChange={(v) => rateMutation.mutate({ rating: v })}
            />
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                onPress={() => rateMutation.mutate({ interested: !(myRating?.interested ?? false) })}
                className={`flex-row items-center px-3 py-2 rounded-xl ${
                  myRating?.interested ? "bg-red-100" : "bg-white border border-gray-200"
                }`}
              >
                <Heart size={14} color={myRating?.interested ? "#ef4444" : "#6b7280"} fill={myRating?.interested ? "#ef4444" : "none"} />
                <Text className={`text-sm ml-1.5 font-medium ${myRating?.interested ? "text-red-600" : "text-gray-600"}`}>
                  Interested
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => rateMutation.mutate({ applying: !(myRating?.applying ?? false) })}
                className={`flex-row items-center px-3 py-2 rounded-xl ${
                  myRating?.applying ? "bg-green-100" : "bg-white border border-gray-200"
                }`}
              >
                <Text className={`text-sm font-medium ${myRating?.applying ? "text-green-700" : "text-gray-600"}`}>
                  ✓ Applying
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {gl.listing.description && (
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <Text className="text-gray-600 leading-relaxed">{gl.listing.description}</Text>
            </View>
          )}

          {/* Landlord */}
          {(gl.listing.landlordName || gl.listing.landlordEmail) && (
            <View className="bg-gray-50 rounded-xl p-4 mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Landlord</Text>
              {gl.listing.landlordName && <Text className="text-gray-700">{gl.listing.landlordName}</Text>}
              {gl.listing.landlordEmail && <Text className="text-brand-600">{gl.listing.landlordEmail}</Text>}
              {gl.listing.landlordPhone && <Text className="text-gray-700">{gl.listing.landlordPhone}</Text>}
            </View>
          )}

          {/* Comments */}
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <MessageSquare size={16} color="#374151" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Comments ({gl.comments.length})
              </Text>
            </View>

            {gl.comments.map((c) => (
              <View key={c.id} className="mb-3">
                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-brand-100 items-center justify-center mr-2 mt-0.5">
                    <Text className="text-brand-700 text-xs font-semibold">
                      {getInitials(c.user?.name ?? "?")}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="text-sm font-semibold text-gray-900">{c.user?.name}</Text>
                      <Text className="text-xs text-gray-400 ml-2">{formatRelativeTime(c.createdAt as string)}</Text>
                    </View>
                    <Text className="text-gray-700 text-sm">{c.content}</Text>

                    {/* Replies */}
                    {c.replies?.map((r) => (
                      <View key={r.id} className="mt-2 ml-4 bg-gray-50 rounded-xl p-3">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-xs font-semibold text-gray-700">{r.user?.name}</Text>
                          <Text className="text-xs text-gray-400 ml-2">{formatRelativeTime(r.createdAt as string)}</Text>
                        </View>
                        <Text className="text-gray-600 text-sm">{r.content}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment input */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 flex-row items-center gap-2">
        <TextInput
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 bg-gray-50"
          placeholder="Add a comment..."
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <TouchableOpacity
          onPress={submitComment}
          disabled={!comment.trim() || submitting}
          className="bg-brand-600 rounded-xl p-3"
          style={{ opacity: !comment.trim() || submitting ? 0.5 : 1 }}
        >
          {submitting ? <ActivityIndicator size="small" color="white" /> : <Send size={18} color="white" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
