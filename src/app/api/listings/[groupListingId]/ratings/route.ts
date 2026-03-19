import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  interested: z.boolean().optional(),
  applying: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupListingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const gl = await prisma.groupListing.findFirst({
    where: { id: (await paramsPromise).groupListingId, group: { members: { some: { userId } } } },
  });
  if (!gl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data = RatingSchema.parse(body);

    const rating = await prisma.listingRating.upsert({
      where: { groupListingId_userId: { groupListingId: (await paramsPromise).groupListingId, userId } },
      create: { groupListingId: (await paramsPromise).groupListingId, userId, ...data },
      update: data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Update groupListing updatedAt for ranking recency
    await prisma.groupListing.update({
      where: { id: (await paramsPromise).groupListingId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ data: rating });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Rating failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupListingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const data = z.object({
      rating: z.number().int().min(1).max(5).optional(),
      interested: z.boolean().optional(),
      applying: z.boolean().optional(),
    }).parse(body);

    const rating = await prisma.listingRating.upsert({
      where: { groupListingId_userId: { groupListingId: (await paramsPromise).groupListingId, userId } },
      create: { groupListingId: (await paramsPromise).groupListingId, userId, rating: data.rating ?? 3, ...data },
      update: data,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    await prisma.groupListing.update({
      where: { id: (await paramsPromise).groupListingId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ data: rating });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
