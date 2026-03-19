"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ListingCard } from "@/components/listings/ListingCard";
import { AddListingModal } from "@/components/listings/AddListingModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, PlusCircle, Copy, Check, Sparkles, Loader2,
  MapPin, DollarSign, Calendar, Bed, Users, FileText, SlidersHorizontal,
} from "lucide-react";
import { formatPrice, formatDate, getInitials, buildInviteUrl } from "@/lib/utils";
import { rankListings, computeAvgRating } from "@/lib/ranking";
import { useToast } from "@/hooks/use-toast";

export default function GroupPage() {
  const params = useParams<{ groupId: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  if (status === "unauthenticated") { router.push("/login"); return null; }

  const currentUserId = (session?.user as { id?: string })?.id ?? "";

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", params.groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${params.groupId}`);
      return (await res.json()).data;
    },
    enabled: !!params.groupId && status === "authenticated",
  });

  const { data: listingsData, isLoading: listingsLoading, refetch } = useQuery({
    queryKey: ["group-listings", params.groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${params.groupId}/listings`);
      return (await res.json()).data ?? [];
    },
    enabled: !!params.groupId && status === "authenticated",
  });

  const memberCount = group?.members?.length ?? 0;

  const withAvg = (listingsData ?? []).map((gl: any) => ({
    ...gl,
    avgRating: computeAvgRating({ ...gl, avgRating: 0, interestedCount: 0, applyingCount: 0, score: 0, rank: 0 }),
    interestedCount: gl.ratings?.filter((r: any) => r.interested).length ?? 0,
    applyingCount: gl.ratings?.filter((r: any) => r.applying).length ?? 0,
  }));

  const ranked = rankListings(withAvg, memberCount);

  const filtered = statusFilter === "ALL" ? ranked : ranked.filter((l: any) => l.status === statusFilter);

  async function copyInvite() {
    if (!group?.inviteCode) return;
    await navigator.clipboard.writeText(buildInviteUrl(group.inviteCode));
    setCopied(true);
    toast({ title: "Invite link copied!", description: "Share with your roommates" });
    setTimeout(() => setCopied(false), 2000);
  }

  async function getSuggestions() {
    setLoadingAI(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: params.groupId }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }

      const suggestions = data.data ?? [];
      let added = 0;
      for (const s of suggestions) {
        const addRes = await fetch(`/api/groups/${params.groupId}/listings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...s, aiSuggested: true }),
        });
        if (addRes.ok) added++;
      }
      toast({ title: `${added} AI suggestions added!`, description: "Review them in the listing board below." });
      refetch();
    } finally {
      setLoadingAI(false);
    }
  }

  async function updateStatus(groupListingId: string, newStatus: string) {
    await fetch(`/api/listings/${groupListingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    refetch();
  }

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard"><Button variant="ghost" size="sm" className="gap-2 mb-4"><ArrowLeft className="w-4 h-4" />Dashboard</Button></Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {group.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.location}</span>}
                {(group.budgetMin || group.budgetMax) && (
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatPrice(group.budgetMin)} – {formatPrice(group.budgetMax)}</span>
                )}
                {group.moveInDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Move in {formatDate(group.moveInDate)}</span>}
                {(group.bedsMin || group.bedsMax) && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{group.bedsMin}–{group.bedsMax} beds</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyInvite} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}Invite
              </Button>
              <Button variant="outline" size="sm" onClick={getSuggestions} disabled={loadingAI} className="gap-2">
                {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-500" />}AI Suggestions
              </Button>
              <Link href={`/groups/${params.groupId}/apply`}>
                <Button variant="outline" size="sm" className="gap-2"><FileText className="w-4 h-4" />Apply</Button>
              </Link>
              <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
                <PlusCircle className="w-4 h-4" />Add Listing
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="listings">
          <TabsList className="mb-6">
            <TabsTrigger value="listings">Listings ({ranked.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({memberCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="CONSIDERING">Considering</SelectItem>
                  <SelectItem value="APPLYING">Applying</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SIGNED">Signed</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {listingsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <PlusCircle className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-700 mb-2">No listings yet</h3>
                <p className="text-muted-foreground mb-6 text-sm">Add your first listing or let AI find some for you</p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => setAddOpen(true)} className="gap-2"><PlusCircle className="w-4 h-4" />Add listing</Button>
                  <Button variant="outline" onClick={getSuggestions} disabled={loadingAI} className="gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />Get AI suggestions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((gl: any) => (
                  <div key={gl.id} className="flex flex-col gap-2">
                    <ListingCard
                      groupListingId={gl.id}
                      listing={gl.listing}
                      status={gl.status}
                      avgRating={gl.avgRating}
                      interestedCount={gl.interestedCount}
                      commentCount={gl.comments?.length ?? 0}
                      ratings={gl.ratings ?? []}
                      members={group.members ?? []}
                      currentUserId={currentUserId}
                      rank={gl.rank}
                      score={gl.score}
                      onUpdate={refetch}
                    />
                    {/* Status quick-change */}
                    <Select value={gl.status} onValueChange={v => updateStatus(gl.id, v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSIDERING">Considering</SelectItem>
                        <SelectItem value="APPLYING">Applying</SelectItem>
                        <SelectItem value="APPLIED">Applied</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="SIGNED">Signed 🎉</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members?.map((m: any) => (
                <div key={m.userId} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                      {getInitials(m.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{m.user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{m.user.email}</p>
                  </div>
                  <Badge variant={m.role === "OWNER" ? "default" : "secondary"} className="shrink-0 text-xs">
                    {m.role.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
            {group.notes && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Group Notes</p>
                <p className="text-sm text-amber-700">{group.notes}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AddListingModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          groupId={params.groupId}
          onAdded={refetch}
        />
      </main>
    </div>
  );
}
