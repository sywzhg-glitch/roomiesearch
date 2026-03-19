"use client";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RatingWidget } from "./RatingWidget";
import { formatPrice, getInitials } from "@/lib/utils";
import { Bed, Bath, Maximize, MapPin, MessageSquare, Heart, Sparkles, Star, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Member {
  userId: string;
  user: { id: string; name: string; avatar?: string | null };
}

interface Rating {
  userId: string;
  rating: number;
  interested: boolean;
  applying: boolean;
  user: { id: string; name: string; avatar?: string | null };
}

interface ListingCardProps {
  groupListingId: string;
  listing: {
    id: string;
    price?: number | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    beds?: number | null;
    baths?: number | null;
    sqft?: number | null;
    images: string[];
    aiSuggested: boolean;
  };
  status: string;
  avgRating: number;
  interestedCount: number;
  commentCount: number;
  ratings: Rating[];
  members: Member[];
  currentUserId: string;
  rank: number;
  score: number;
  onUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  CONSIDERING: "bg-gray-100 text-gray-700",
  APPLYING: "bg-blue-100 text-blue-700",
  APPLIED: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-600",
  SIGNED: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  CONSIDERING: "Considering", APPLYING: "Applying", APPLIED: "Applied", REJECTED: "Rejected", SIGNED: "Signed",
};

export function ListingCard({
  groupListingId, listing, status, avgRating, interestedCount, commentCount,
  ratings, members, currentUserId, rank, score, onUpdate,
}: ListingCardProps) {
  const { toast } = useToast();
  const myRating = ratings.find(r => r.userId === currentUserId);
  const [submitting, setSubmitting] = useState(false);

  const image = listing.images?.[0];
  const location = [listing.address, listing.city, listing.state].filter(Boolean).join(", ");

  async function rateOrToggle(update: { rating?: number; interested?: boolean; applying?: boolean }) {
    setSubmitting(true);
    try {
      await fetch(`/api/listings/${groupListingId}/ratings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: myRating?.rating ?? 3, ...update }),
      });
      onUpdate();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-gray-100 shrink-0">
        {image ? (
          <Image src={image} alt={listing.address ?? "listing"} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Maximize className="w-10 h-10" />
          </div>
        )}
        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white shadow font-bold text-xs flex items-center justify-center text-indigo-600">
          #{rank}
        </div>
        {listing.aiSuggested && (
          <Badge variant="ai" className="absolute top-2 right-2 gap-1 text-xs">
            <Sparkles className="w-3 h-3" /> AI
          </Badge>
        )}
        <div className={cn("absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 rounded-full", STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Price & address */}
        <div>
          <div className="text-xl font-bold text-gray-900">{formatPrice(listing.price)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {listing.beds != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{listing.beds}bd</span>}
          {listing.baths != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{listing.baths}ba</span>}
          {listing.sqft != null && <span className="flex items-center gap-1"><Maximize className="w-3 h-3" />{listing.sqft.toLocaleString()} ft²</span>}
        </div>

        {/* Group ratings */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Group avg: <strong className="text-amber-500">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</strong></span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />{interestedCount} interested</span>
          </div>
          {/* Score bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(score, 100)}%` }} />
          </div>
          {/* Per-member ratings */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {members.map(m => {
              const r = ratings.find(rt => rt.userId === m.userId);
              return (
                <div key={m.userId} className="flex items-center gap-1 bg-gray-50 rounded-md px-1.5 py-0.5" title={`${m.user.name}: ${r?.rating ?? "unrated"} ⭐`}>
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700">{getInitials(m.user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">{r?.rating ?? "—"}</span>
                  {r?.interested && <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* My rating */}
        <div className="flex items-center justify-between pt-1 border-t">
          <RatingWidget
            value={myRating?.rating ?? 0}
            onChange={rating => rateOrToggle({ rating })}
            size="sm"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => rateOrToggle({ interested: !myRating?.interested })}
              disabled={submitting}
              className={cn("p-1.5 rounded-md transition-colors text-xs flex items-center gap-1", myRating?.interested ? "bg-rose-50 text-rose-500" : "text-gray-400 hover:bg-gray-100")}
            >
              <Heart className={cn("w-3.5 h-3.5", myRating?.interested && "fill-rose-400")} />
            </button>
            <button
              onClick={() => rateOrToggle({ applying: !myRating?.applying })}
              disabled={submitting}
              className={cn("p-1.5 rounded-md transition-colors text-xs flex items-center gap-1", myRating?.applying ? "bg-green-50 text-green-600" : "text-gray-400 hover:bg-gray-100")}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <span className="flex items-center gap-0.5 text-xs text-gray-400 ml-1">
              <MessageSquare className="w-3 h-3" />{commentCount}
            </span>
          </div>
        </div>

        <Link href={`/listings/${groupListingId}`}>
          <Button variant="outline" size="sm" className="w-full">View details</Button>
        </Link>
      </div>
    </div>
  );
}
