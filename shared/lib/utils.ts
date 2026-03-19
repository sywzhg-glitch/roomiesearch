// Pure utility functions — safe for both web and mobile.
// cn() is omitted here (it needs clsx/tailwind-merge which are web-only);
// use it directly in web/mobile specific code instead.

export function formatPrice(price: number | null | undefined): string {
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

export function parsePrice(value: string): number | undefined {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : Math.round(parsed);
}

export function parseBedsText(text: string): number | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:bed|br|bedroom)/i);
  if (match) return parseFloat(match[1]);
  if (/studio/i.test(text)) return 0;
  return undefined;
}

export function parseBathsText(text: string): number | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba)/i);
  if (match) return parseFloat(match[1]);
  return undefined;
}

export function parseSqft(text: string): number | undefined {
  const match = text.match(/(\d[\d,]*)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return undefined;
}

/** Build an invite URL. Pass the base URL explicitly (no process.env dependency). */
export function buildInviteUrl(inviteCode: string, baseUrl: string): string {
  return `${baseUrl}/join/${inviteCode}`;
}
