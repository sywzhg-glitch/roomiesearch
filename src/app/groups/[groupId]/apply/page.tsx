"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Download, Check, Loader2, Users } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ApplyPage() {
  const params = useParams<{ groupId: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  if (status === "unauthenticated") { router.push("/login"); return null; }

  const { data: groupData } = useQuery({
    queryKey: ["group", params.groupId],
    queryFn: async () => (await (await fetch(`/api/groups/${params.groupId}`)).json()).data,
  });

  const { data: appData, refetch } = useQuery({
    queryKey: ["app-data", params.groupId],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${params.groupId}`);
      return (await res.json()).data;
    },
    enabled: !!params.groupId && status === "authenticated",
  });

  // Find my app data
  const currentUserId = (session?.user as { id?: string })?.id ?? "";
  const myMemberData = appData?.find((m: any) => m.userId === currentUserId);
  const myApp = myMemberData?.user?.applicationData;

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: session?.user?.email ?? "",
    phone: "", currentAddress: "", income: "", employer: "",
    jobTitle: "", employmentYears: "", creditScore: "",
    hasGuarantor: false, guarantorName: "", guarantorEmail: "",
    guarantorPhone: "", guarantorIncome: "",
  });

  // Populate from existing data
  useEffect(() => {
    if (myApp) {
      setForm({
        firstName: myApp.firstName ?? "",
        lastName: myApp.lastName ?? "",
        email: myApp.email ?? session?.user?.email ?? "",
        phone: myApp.phone ?? "",
        currentAddress: myApp.currentAddress ?? "",
        income: myApp.income?.toString() ?? "",
        employer: myApp.employer ?? "",
        jobTitle: myApp.jobTitle ?? "",
        employmentYears: myApp.employmentYears?.toString() ?? "",
        creditScore: myApp.creditScore?.toString() ?? "",
        hasGuarantor: myApp.hasGuarantor ?? false,
        guarantorName: myApp.guarantorName ?? "",
        guarantorEmail: myApp.guarantorEmail ?? "",
        guarantorPhone: myApp.guarantorPhone ?? "",
        guarantorIncome: myApp.guarantorIncome?.toString() ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myApp?.firstName]);

  function update(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  async function saveMyInfo() {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${params.groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName || undefined, lastName: form.lastName || undefined,
          email: form.email || undefined, phone: form.phone || undefined,
          currentAddress: form.currentAddress || undefined,
          income: form.income ? parseInt(form.income) : undefined,
          employer: form.employer || undefined, jobTitle: form.jobTitle || undefined,
          employmentYears: form.employmentYears ? parseInt(form.employmentYears) : undefined,
          creditScore: form.creditScore ? parseInt(form.creditScore) : undefined,
          hasGuarantor: form.hasGuarantor,
          guarantorName: form.hasGuarantor ? form.guarantorName : undefined,
          guarantorEmail: form.hasGuarantor ? form.guarantorEmail : undefined,
          guarantorPhone: form.hasGuarantor ? form.guarantorPhone : undefined,
          guarantorIncome: form.hasGuarantor && form.guarantorIncome ? parseInt(form.guarantorIncome) : undefined,
        }),
      });
      if (res.ok) {
        setSaved(true);
        refetch();
        toast({ title: "Info saved!", description: "Your application data is ready" });
        setTimeout(() => setSaved(false), 3000);
      }
    } finally { setSaving(false); }
  }

  async function generatePDF() {
    if (!appData || !groupData) return;
    setGenerating(true);
    try {
      const allApplicants = appData
        .filter((m: any) => m.user?.applicationData)
        .map((m: any) => m.user.applicationData);

      if (allApplicants.length === 0) {
        toast({ title: "No applicants yet", description: "At least one member needs to fill in their info", variant: "destructive" });
        return;
      }

      const { generateApplicationPDF } = await import("@/lib/pdf");
      const listingsRes = await fetch(`/api/groups/${params.groupId}/listings`);
      const listingsJson = await listingsRes.json();
      const topListing = listingsJson.data?.[0]?.listing;

      await generateApplicationPDF({
        group: groupData,
        listing: topListing ?? { address: "TBD" },
        applicants: allApplicants,
      });
      toast({ title: "PDF downloaded!", description: "Your application packet is ready to send" });
    } finally { setGenerating(false); }
  }

  const readyCount = appData?.filter((m: any) => m.user?.applicationData).length ?? 0;
  const totalCount = appData?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" size="sm" className="gap-2 mb-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />Back
        </Button>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Builder</h1>
            <p className="text-muted-foreground mt-1">Fill in your info, then generate a combined PDF for the group</p>
          </div>
          <Button onClick={generatePDF} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Generate PDF Packet
          </Button>
        </div>

        {/* Team readiness */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Team readiness</span>
              </div>
              <Badge variant={readyCount === totalCount ? "success" : "secondary"}>
                {readyCount}/{totalCount} ready
              </Badge>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: totalCount > 0 ? `${(readyCount / totalCount) * 100}%` : "0%" }} />
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {appData?.map((m: any) => (
                <div key={m.userId} className="flex items-center gap-2 text-sm">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">{getInitials(m.user.name)}</AvatarFallback>
                    </Avatar>
                    {m.user.applicationData && (
                      <Check className="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5" />
                    )}
                  </div>
                  <span className={m.user.applicationData ? "text-gray-900" : "text-gray-400"}>{m.user.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="my-info">
          <TabsList className="mb-6">
            <TabsTrigger value="my-info">My Information</TabsTrigger>
            <TabsTrigger value="team">Team Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="my-info">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>This info will be included in the combined application packet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={e => update("firstName", e.target.value)} placeholder="Alice" /></div>
                  <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="Chen" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => update("email", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="415-555-0100" /></div>
                  <div className="col-span-2 space-y-2"><Label>Current address</Label><Input value={form.currentAddress} onChange={e => update("currentAddress", e.target.value)} placeholder="123 Main St, San Francisco, CA 94102" /></div>
                </div>

                <Separator />
                <h3 className="font-semibold text-gray-900">Employment & Income</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Employer</Label><Input value={form.employer} onChange={e => update("employer", e.target.value)} placeholder="TechCorp Inc" /></div>
                  <div className="space-y-2"><Label>Job title</Label><Input value={form.jobTitle} onChange={e => update("jobTitle", e.target.value)} placeholder="Software Engineer" /></div>
                  <div className="space-y-2"><Label>Annual income ($)</Label><Input type="number" value={form.income} onChange={e => update("income", e.target.value)} placeholder="120000" /></div>
                  <div className="space-y-2"><Label>Years at job</Label><Input type="number" value={form.employmentYears} onChange={e => update("employmentYears", e.target.value)} placeholder="3" /></div>
                  <div className="space-y-2"><Label>Credit score (optional)</Label><Input type="number" value={form.creditScore} onChange={e => update("creditScore", e.target.value)} placeholder="750" min="300" max="850" /></div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="hasGuarantor" checked={form.hasGuarantor} onChange={e => update("hasGuarantor", e.target.checked)} className="w-4 h-4 rounded" />
                  <Label htmlFor="hasGuarantor">I have a guarantor / co-signer</Label>
                </div>

                {form.hasGuarantor && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2"><Label>Guarantor name</Label><Input value={form.guarantorName} onChange={e => update("guarantorName", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Guarantor email</Label><Input type="email" value={form.guarantorEmail} onChange={e => update("guarantorEmail", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Guarantor phone</Label><Input value={form.guarantorPhone} onChange={e => update("guarantorPhone", e.target.value)} /></div>
                    <div className="space-y-2"><Label>Guarantor annual income ($)</Label><Input type="number" value={form.guarantorIncome} onChange={e => update("guarantorIncome", e.target.value)} /></div>
                  </div>
                )}

                <Button onClick={saveMyInfo} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {saved ? "Saved!" : "Save my info"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <div className="space-y-4">
              {appData?.map((m: any) => {
                const app = m.user?.applicationData;
                return (
                  <Card key={m.userId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">{getInitials(m.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{m.user.name}</CardTitle>
                          <CardDescription>{m.user.email}</CardDescription>
                        </div>
                        <Badge variant={app ? "success" : "secondary"} className="ml-auto">
                          {app ? "Ready" : "Not filled"}
                        </Badge>
                      </div>
                    </CardHeader>
                    {app && (
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          {app.employer && <div><span className="text-muted-foreground">Employer: </span>{app.employer}</div>}
                          {app.income && <div><span className="text-muted-foreground">Income: </span>${app.income.toLocaleString()}/yr</div>}
                          {app.creditScore && <div><span className="text-muted-foreground">Credit: </span>{app.creditScore}</div>}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
