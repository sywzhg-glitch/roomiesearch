"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, DollarSign, Calendar, Users, Home, Search, PlusCircle, Loader2, Send } from "lucide-react";
import { formatPrice, formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  OPEN_ROOM: { label: "Open Room", color: "bg-blue-100 text-blue-700", description: "Group has a spare room" },
  LOOKING_FOR_GROUP: { label: "Looking for Group", color: "bg-purple-100 text-purple-700", description: "Person seeking roommates" },
  LOOKING_TO_JOIN: { label: "Looking to Join", color: "bg-green-100 text-green-700", description: "Wants to join an existing lease" },
};

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState<string | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [posting, setPosting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [postForm, setPostForm] = useState({ type: "LOOKING_FOR_GROUP", title: "", description: "", location: "", budgetMin: "", budgetMax: "", moveInDate: "" });

  if (status === "unauthenticated") { router.push("/login"); return null; }

  const queryParams = new URLSearchParams();
  if (typeFilter !== "ALL") queryParams.set("type", typeFilter);
  if (locationFilter) queryParams.set("location", locationFilter);

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["marketplace", typeFilter, locationFilter],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace?${queryParams.toString()}`);
      return (await res.json()).data ?? [];
    },
  });

  async function postListing() {
    setPosting(true);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: postForm.type,
          title: postForm.title,
          description: postForm.description || undefined,
          location: postForm.location || undefined,
          budgetMin: postForm.budgetMin ? parseInt(postForm.budgetMin) : undefined,
          budgetMax: postForm.budgetMax ? parseInt(postForm.budgetMax) : undefined,
          moveInDate: postForm.moveInDate || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Listing posted!" });
        setPostOpen(false);
        refetch();
      } else {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
      }
    } finally { setPosting(false); }
  }

  async function sendRequest(profileId: string) {
    setRequesting(true);
    try {
      const res = await fetch(`/api/marketplace/${profileId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: requestMsg || undefined }),
      });
      if (res.ok) {
        toast({ title: "Request sent!", description: "They'll be notified of your interest." });
        setRequestOpen(null);
        setRequestMsg("");
      } else {
        const d = await res.json();
        toast({ title: "Error", description: d.error, variant: "destructive" });
      }
    } finally { setRequesting(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roommate Marketplace</h1>
            <p className="text-muted-foreground mt-1">Find roommates or groups looking for you</p>
          </div>
          <Button onClick={() => setPostOpen(true)} className="gap-2">
            <PlusCircle className="w-4 h-4" />Post a listing
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Filter by city (e.g. San Francisco)"
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="h-9 border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="OPEN_ROOM">Open Room</SelectItem>
              <SelectItem value="LOOKING_FOR_GROUP">Looking for Group</SelectItem>
              <SelectItem value="LOOKING_TO_JOIN">Looking to Join</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-52 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (profiles ?? []).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-6">Be the first to post a listing!</p>
            <Button onClick={() => setPostOpen(true)} className="gap-2"><PlusCircle className="w-4 h-4" />Post listing</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(profiles ?? []).map((p: any) => {
              const typeInfo = TYPE_LABELS[p.type];
              const isGroup = !!p.group;
              const displayName = isGroup ? p.group?.name : p.user?.name;
              const memberCount = p.group?.members?.length;

              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge className={typeInfo.color + " shrink-0 text-xs"}>{typeInfo.label}</Badge>
                      {isGroup && memberCount && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />{memberCount} members
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2">{p.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                          {getInitials(displayName ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <CardDescription className="text-xs">{displayName}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                      {(p.budgetMin || p.budgetMax) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {p.budgetMin ? formatPrice(p.budgetMin) : "?"} – {p.budgetMax ? formatPrice(p.budgetMax) : "?"}
                        </span>
                      )}
                      {p.moveInDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(p.moveInDate)}</span>}
                      {p.openRooms && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{p.openRooms} open room{p.openRooms > 1 ? "s" : ""}</span>}
                    </div>
                    <Button size="sm" className="w-full gap-2" onClick={() => setRequestOpen(p.id)}>
                      <Send className="w-3.5 h-3.5" />Connect
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Post listing dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post to Marketplace</DialogTitle>
            <DialogDescription>Let others know you're looking for roommates or have a room available</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={postForm.type} onValueChange={v => setPostForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN_ROOM">Open Room — I have a spare room</SelectItem>
                  <SelectItem value="LOOKING_FOR_GROUP">Looking for Group — I need roommates</SelectItem>
                  <SelectItem value="LOOKING_TO_JOIN">Looking to Join — I want to join a group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. SF software dev looking for roommates" value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Tell others about yourself or your group…" value={postForm.description} onChange={e => setPostForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="San Francisco, CA" value={postForm.location} onChange={e => setPostForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Budget min ($/mo)</Label>
                <Input type="number" placeholder="1200" value={postForm.budgetMin} onChange={e => setPostForm(f => ({ ...f, budgetMin: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Budget max ($/mo)</Label>
                <Input type="number" placeholder="2000" value={postForm.budgetMax} onChange={e => setPostForm(f => ({ ...f, budgetMax: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Move-in date</Label>
              <Input type="date" value={postForm.moveInDate} onChange={e => setPostForm(f => ({ ...f, moveInDate: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button onClick={postListing} disabled={posting || !postForm.title} className="flex-1">
                {posting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Post listing
              </Button>
              <Button variant="outline" onClick={() => setPostOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request dialog */}
      <Dialog open={!!requestOpen} onOpenChange={() => { setRequestOpen(null); setRequestMsg(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a connection request</DialogTitle>
            <DialogDescription>Introduce yourself and let them know why you're interested</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Hi! I saw your listing and I'm interested because…"
              value={requestMsg}
              onChange={e => setRequestMsg(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="flex gap-3">
              <Button onClick={() => requestOpen && sendRequest(requestOpen)} disabled={requesting} className="flex-1 gap-2">
                {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send request
              </Button>
              <Button variant="outline" onClick={() => setRequestOpen(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
