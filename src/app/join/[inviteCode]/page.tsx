"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2, MapPin, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinPage() {
  const params = useParams<{ inviteCode: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/groups/join/${params.inviteCode}`)
      .then(r => r.json())
      .then(d => { if (d.data) setGroupInfo(d.data); })
      .finally(() => setLoading(false));
  }, [params.inviteCode]);

  async function handleJoin() {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/join/${params.inviteCode}`);
      return;
    }
    setJoining(true);
    try {
      const res = await fetch(`/api/groups/join/${params.inviteCode}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setJoined(true);
        toast({ title: "Joined group!", description: `Welcome to ${groupInfo?.name}` });
        setTimeout(() => router.push(`/groups/${data.data.groupId}`), 1500);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } finally { setJoining(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">RoomieSearch</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>You've been invited!</CardTitle>
            <CardDescription>Someone wants you to join their roommate group</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
            ) : !groupInfo ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">This invite link is invalid or has expired.</p>
                <Link href="/dashboard"><Button variant="outline">Go to dashboard</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 text-lg">{groupInfo.name}</h3>
                  {groupInfo.location && (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />{groupInfo.location}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{groupInfo._count?.members} member{groupInfo._count?.members !== 1 ? "s" : ""} already joined</p>
                </div>

                {joined ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl text-green-700 font-medium">
                    <Check className="w-5 h-5" />Joined! Redirecting…
                  </div>
                ) : (
                  <Button onClick={handleJoin} disabled={joining} className="w-full gap-2">
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    {status === "unauthenticated" ? "Sign in to join" : "Join group"}
                  </Button>
                )}

                {status === "unauthenticated" && (
                  <p className="text-xs text-center text-muted-foreground">
                    Don't have an account? <Link href={`/signup`} className="text-indigo-600 hover:underline">Sign up free</Link>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
