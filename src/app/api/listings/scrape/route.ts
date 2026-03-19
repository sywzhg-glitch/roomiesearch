import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scrapeListing } from "@/lib/scraper";
import { z } from "zod";

const ScrapeSchema = z.object({ url: z.string().url("Invalid URL") });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { url } = ScrapeSchema.parse(body);
    const result = await scrapeListing(url);
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  }
}
