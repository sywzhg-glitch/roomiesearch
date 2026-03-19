"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Users, MapPin, Calendar, DollarSign, Home, Copy, Check } from "lucide-react";
import { formatPrice, formatDate, getInitials, buildInviteUrl } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (status === "unauthenticated") redirect("/login");

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      const json = await res.json();
      return json.data;
    },
    enabled: status === "authenticated",
  });

  async function copyInviteLink(inviteCode: string, groupId: string) {
    await navigator.clipboard.writeText(buildInviteUrl(inviteCode));
    setCopiedId(groupId);
    toast({ title: "Invite link copied!", description: "Share it with your future roommates" });
    setTimeout(() => setCopiedId(null), 2000);
  }

  const groups = data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {session?.user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Manage your roommate groups and apartment search</p>
          </div>
          <Link href="/groups/new">
            <Button className="gap-2"><PlusCircle className="w-4 h-4" />New Group</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-6">Create your first roommate group to get started</p>
            <Link href="/groups/new"><Button className="gap-2"><PlusCircle className="w-4 h-4" />Create a group</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{group.location ?? "Location not set"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{group._count?.listings ?? 0} listings</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {(group.budgetMin || group.budgetMax) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatPrice(group.budgetMin)} – {formatPrice(group.budgetMax)}
                      </span>
                    )}
                    {group.moveInDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDate(group.moveInDate)}
                      </span>
                    )}
                    {(group.bedsMin || group.bedsMax) && (
                      <span className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {group.bedsMin}–{group.bedsMax} beds
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {group.members?.slice(0, 4).map((m: any) => (
                        <Avatar key={m.userId} className="h-7 w-7 border-2 border-white">
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold">
                            {getInitials(m.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{group.members?.length} member{group.members?.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/groups/${group.id}`} className="flex-1">
                      <Button className="w-full" size="sm">View group</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => copyInviteLink(group.inviteCode, group.id)} className="gap-1">
                      {copiedId === group.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Link href="/groups/new">
              <div className="h-full min-h-[220px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer p-6">
                <PlusCircle className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-500">Create another group</p>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
