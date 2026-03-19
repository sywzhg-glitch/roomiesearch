"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { RatingWidget } from "@/components/listings/RatingWidget";
import { CommentThread } from "@/components/listings/CommentThread";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Bed, Bath, Maximize, MapPin, DollarSign, Phone, Mail,
  User, Heart, Check, ExternalLink, Sparkles, Loader2,
} from "lucide-react";
import { formatPrice, getInitials } from "@/lib/utils";
import { computeAvgRating } from "@/lib/ranking";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS_OPTS = [
  { value: "CONSIDERING", label: "Considering" },
  { value: "APPLYING", label: "Applying" },
  { value: "APPLIED", label: "Applied" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SIGNED", label: "Signed 🎉" },
];

export default function ListingDetailPage() {
  const params = useParams<{ groupListingId: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [imgIdx, setImgIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  if (status === "unauthenticated") { router.push("/login"); return null; }
  const currentUserId = (session?.user as { id?: string })?.id ?? "";

  const { data: gl, isLoading, refetch } = useQuery({
    queryKey: ["group-listing", params.groupListingId],
    queryFn: async () => {
      const res = await fetch(`/api/listings/${params.groupListingId}`);
      return (await res.json()).data;
    },
    enabled: !!params.groupListingId && status === "authenticated",
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
    </div>
  );
  if (!gl) return null;

  const { listing, ratings, comments, group } = gl;
  const myRating = ratings.find((r: any) => r.userId === currentUserId);
  const avgRating = computeAvgRating({ ...gl, avgRating: 0, interestedCount: 0, applyingCount: 0, score: 0, rank: 0 });
  const images: string[] = listing.images ?? [];

  async function rateOrToggle(update: { rating?: number; interested?: boolean; applying?: boolean }) {
    setSaving(true);
    await fetch(`/api/listings/${params.groupListingId}/ratings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: myRating?.rating ?? 3, ...update }),
    });
    await refetch();
    setSaving(false);
  }

  async function updateStatus(newStatus: string) {
    await fetch(`/api/listings/${params.groupListingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await refetch();
    toast({ title: "Status updated" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
          {listing.aiSuggested && <Badge variant="ai" className="gap-1"><Sparkles className="w-3 h-3" />AI Suggested</Badge>}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column — images + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="rounded-2xl overflow-hidden bg-gray-200 aspect-video relative">
              {images.length > 0 ? (
                <Image src={images[imgIdx]} alt="listing" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Maximize className="w-16 h-16" />
                </div>
              )}
              {listing.url && (
                <a href={listing.url} target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3">
                  <Button size="sm" variant="secondary" className="gap-1 shadow">
                    <ExternalLink className="w-3 h-3" />View original
                  </Button>
                </a>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={cn("rounded-lg overflow-hidden h-16 w-24 shrink-0 border-2 transition-colors", i === imgIdx ? "border-indigo-500" : "border-transparent")}>
                    <Image src={img} alt="" width={96} height={64} className="object-cover w-full h-full" unoptimized />
                  </button>
                ))}
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{formatPrice(listing.price)}<span className="text-base font-normal text-muted-foreground">/mo</span></h1>
              {[listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(", ") && (
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {[listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {listing.beds != null && <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{listing.beds} bed{listing.beds !== 1 ? "s" : ""}</span>}
                {listing.baths != null && <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{listing.baths} bath{listing.baths !== 1 ? "s" : ""}</span>}
                {listing.sqft != null && <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{listing.sqft.toLocaleString()} ft²</span>}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-2">About this listing</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            <Separator />

            {/* Comments */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Group Discussion</h2>
              <CommentThread
                groupListingId={params.groupListingId}
                comments={comments ?? []}
                currentUserId={currentUserId}
                onComment={refetch}
              />
            </div>
          </div>

          {/* Right column — actions */}
          <div className="space-y-4">
            {/* My rating card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">How do you feel about this place?</p>
                  <RatingWidget value={myRating?.rating ?? 0} onChange={rating => rateOrToggle({ rating })} size="lg" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => rateOrToggle({ interested: !myRating?.interested })}
                    disabled={saving}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors",
                      myRating?.interested ? "bg-rose-50 border-rose-200 text-rose-600" : "hover:bg-gray-50")}
                  >
                    <Heart className={cn("w-4 h-4", myRating?.interested && "fill-rose-500 text-rose-500")} />
                    {myRating?.interested ? "Interested" : "Interested?"}
                  </button>
                  <button
                    onClick={() => rateOrToggle({ applying: !myRating?.applying })}
                    disabled={saving}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors",
                      myRating?.applying ? "bg-green-50 border-green-200 text-green-600" : "hover:bg-gray-50")}
                  >
                    <Check className="w-4 h-4" />
                    {myRating?.applying ? "Applying" : "Apply?"}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Group scores */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Group Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average score</span>
                  <span className="font-bold text-amber-500 text-lg">{avgRating > 0 ? avgRating.toFixed(1) : "—"} ⭐</span>
                </div>
                <Separator />
                {group?.members?.map((m: any) => {
                  const r = ratings.find((rt: any) => rt.userId === m.userId);
                  return (
                    <div key={m.userId} className="flex items-center gap-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{getInitials(m.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm flex-1 truncate">{m.user.name}</span>
                      <div className="flex items-center gap-2">
                        {r ? (
                          <>
                            <RatingWidget value={r.rating} size="sm" readonly />
                            {r.interested && <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No rating</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={gl.status} onValueChange={updateStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {gl.status !== "REJECTED" && (
                  <Link href={`/groups/${gl.groupId}/apply`}>
                    <Button className="w-full gap-2">Build Application Packet</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Landlord */}
            {(listing.landlordName || listing.landlordEmail || listing.landlordPhone) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Landlord / Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {listing.landlordName && (
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{listing.landlordName}</div>
                  )}
                  {listing.landlordEmail && (
                    <a href={`mailto:${listing.landlordEmail}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                      <Mail className="w-4 h-4" />{listing.landlordEmail}
                    </a>
                  )}
                  {listing.landlordPhone && (
                    <a href={`tel:${listing.landlordPhone}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                      <Phone className="w-4 h-4" />{listing.landlordPhone}
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
