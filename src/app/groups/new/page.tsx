"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewGroupPage() {
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", location: "", budgetMin: "", budgetMax: "",
    moveInDate: "", bedsMin: "", bedsMax: "", baths: "", notes: "",
  });

  if (status === "unauthenticated") { router.push("/login"); return null; }

  function update(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location || undefined,
          budgetMin: form.budgetMin ? parseInt(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? parseInt(form.budgetMax) : undefined,
          moveInDate: form.moveInDate || undefined,
          bedsMin: form.bedsMin ? parseInt(form.bedsMin) : undefined,
          bedsMax: form.bedsMax ? parseInt(form.bedsMax) : undefined,
          baths: form.baths ? parseFloat(form.baths) : undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }
      toast({ title: "Group created!", description: "Invite your roommates using the invite link" });
      router.push(`/groups/${data.data.id}`);
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/dashboard"><Button variant="ghost" className="gap-2 mb-6"><ArrowLeft className="w-4 h-4" />Back</Button></Link>
        <Card>
          <CardHeader>
            <CardTitle>Create a Roommate Group</CardTitle>
            <CardDescription>Set your group preferences — you can always update these later</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Group name *</Label>
                <Input id="name" placeholder="e.g. SF Roomies 2024" value={form.name} onChange={e => update("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Target location</Label>
                <Input id="location" placeholder="e.g. San Francisco, CA" value={form.location} onChange={e => update("location", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Min budget ($/mo)</Label>
                  <Input id="budgetMin" type="number" placeholder="2500" value={form.budgetMin} onChange={e => update("budgetMin", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Max budget ($/mo)</Label>
                  <Input id="budgetMax" type="number" placeholder="4500" value={form.budgetMax} onChange={e => update("budgetMax", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moveInDate">Target move-in date</Label>
                <Input id="moveInDate" type="date" value={form.moveInDate} onChange={e => update("moveInDate", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedsMin">Min beds</Label>
                  <Input id="bedsMin" type="number" placeholder="2" min="0" value={form.bedsMin} onChange={e => update("bedsMin", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedsMax">Max beds</Label>
                  <Input id="bedsMax" type="number" placeholder="4" min="0" value={form.bedsMax} onChange={e => update("bedsMax", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baths">Baths</Label>
                  <Input id="baths" type="number" placeholder="2" min="0" step="0.5" value={form.baths} onChange={e => update("baths", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea id="notes" placeholder="Dog friendly preferred, near BART..." value={form.notes} onChange={e => update("notes", e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create group"}</Button>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
