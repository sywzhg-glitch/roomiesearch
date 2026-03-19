"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Sparkles, PenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "url" | "manual";

interface AddListingModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onAdded: () => void;
}

const EMPTY_FORM = {
  url: "", price: "", address: "", city: "", state: "", zip: "",
  beds: "", baths: "", sqft: "", description: "",
  landlordName: "", landlordEmail: "", landlordPhone: "",
};

export function AddListingModal({ open, onClose, groupId, onAdded }: AddListingModalProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("url");
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [scraped, setScraped] = useState(false);

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleScrape() {
    if (!urlInput.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/listings/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const d = data.data;
        setForm({
          url: urlInput,
          price: d.price?.toString() ?? "",
          address: d.address ?? "", city: d.city ?? "", state: d.state ?? "", zip: d.zip ?? "",
          beds: d.beds?.toString() ?? "", baths: d.baths?.toString() ?? "", sqft: d.sqft?.toString() ?? "",
          description: d.description ?? "",
          landlordName: d.landlordName ?? "", landlordEmail: d.landlordEmail ?? "", landlordPhone: d.landlordPhone ?? "",
        });
        setScraped(true);
        setTab("manual");
        if (!d.scrapingSuccess) {
          toast({ title: "Partial import", description: "Could not extract all data. Please fill in missing fields." });
        } else {
          toast({ title: "Listing imported!", description: "Review and edit the details below." });
        }
      }
    } finally {
      setScraping(false);
    }
  }

  async function handleSave() {
    if (!form.address && !form.url) {
      toast({ title: "Required", description: "Add at least an address or URL", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.url || undefined,
          price: form.price ? parseInt(form.price) : undefined,
          address: form.address || undefined, city: form.city || undefined,
          state: form.state || undefined, zip: form.zip || undefined,
          beds: form.beds ? parseFloat(form.beds) : undefined,
          baths: form.baths ? parseFloat(form.baths) : undefined,
          sqft: form.sqft ? parseInt(form.sqft) : undefined,
          description: form.description || undefined,
          landlordName: form.landlordName || undefined,
          landlordEmail: form.landlordEmail || undefined,
          landlordPhone: form.landlordPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Listing added!" });
      setForm(EMPTY_FORM); setUrlInput(""); setScraped(false); setTab("url");
      onAdded(); onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM); setUrlInput(""); setScraped(false); setTab("url");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Listing</DialogTitle>
          <DialogDescription>Paste a listing URL to auto-import, or enter details manually.</DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b pb-3">
          <Button variant={tab === "url" ? "default" : "ghost"} size="sm" className="gap-2" onClick={() => setTab("url")}>
            <Link2 className="w-4 h-4" />Import from URL
          </Button>
          <Button variant={tab === "manual" ? "default" : "ghost"} size="sm" className="gap-2" onClick={() => setTab("manual")}>
            <PenLine className="w-4 h-4" />Manual entry
            {scraped && <Badge variant="success" className="text-[10px] py-0 px-1.5">Imported</Badge>}
          </Button>
        </div>

        {tab === "url" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Listing URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://zillow.com/homes/... or apartments.com/..."
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScrape()}
                />
                <Button onClick={handleScrape} disabled={scraping || !urlInput.trim()} className="shrink-0">
                  {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Supports Zillow, Apartments.com, Craigslist, and more</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-gray-700 mb-1">Tip</p>
              <p>After importing, you'll be able to review and edit all extracted fields before saving.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Listing URL (optional)</Label>
                <Input placeholder="https://..." value={form.url} onChange={e => update("url", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Monthly rent ($)</Label>
                <Input type="number" placeholder="3500" value={form.price} onChange={e => update("price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="123 Main St" value={form.address} onChange={e => update("address", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="San Francisco" value={form.city} onChange={e => update("city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="CA" value={form.state} onChange={e => update("state", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input placeholder="94105" value={form.zip} onChange={e => update("zip", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beds</Label>
                <Input type="number" placeholder="3" min="0" value={form.beds} onChange={e => update("beds", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Baths</Label>
                <Input type="number" placeholder="2" min="0" step="0.5" value={form.baths} onChange={e => update("baths", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sq ft</Label>
                <Input type="number" placeholder="1200" value={form.sqft} onChange={e => update("sqft", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Apartment description…" value={form.description} onChange={e => update("description", e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <Label>Landlord name</Label>
                <Input placeholder="John Smith" value={form.landlordName} onChange={e => update("landlordName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Landlord email</Label>
                <Input type="email" placeholder="landlord@email.com" value={form.landlordEmail} onChange={e => update("landlordEmail", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Landlord phone</Label>
                <Input placeholder="415-555-0200" value={form.landlordPhone} onChange={e => update("landlordPhone", e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Add listing"}
              </Button>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
