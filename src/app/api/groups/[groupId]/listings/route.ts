import { NextRequest, NextResponse } from "next/server";
import { authOptions, getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.groupMember.findFirst({
    where: { groupId: (await paramsPromise).groupId, userId },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const groupListings = await prisma.groupListing.findMany({
    where: { groupId: (await paramsPromise).groupId },
    include: {
      listing: true,
      ratings: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: groupListings });
}

const AddListingSchema = z.object({
  url: z.string().url().optional().or(z.literal("")),
  price: z.number().int().positive().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  beds: z.number().min(0).optional(),
  baths: z.number().min(0).optional(),
  sqft: z.number().int().positive().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  landlordName: z.string().optional(),
  landlordEmail: z.string().email().optional().or(z.literal("")),
  landlordPhone: z.string().optional(),
  aiSuggested: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.groupMember.findFirst({
    where: { groupId: (await paramsPromise).groupId, userId },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const body = await req.json();
    const data = AddListingSchema.parse(body);

    // Check for duplicate URL in this group
    if (data.url) {
      const duplicate = await prisma.groupListing.findFirst({
        where: { groupId: (await paramsPromise).groupId, listing: { url: data.url } },
      });
      if (duplicate) {
        return NextResponse.json({ error: "This listing is already in your group" }, { status: 409 });
      }
    }

    const listing = await prisma.listing.create({ data: { ...data, images: data.images ?? [] } });
    const groupListing = await prisma.groupListing.create({
      data: { groupId: (await paramsPromise).groupId, listingId: listing.id, addedById: userId },
      include: {
        listing: true,
        ratings: true,
        comments: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    return NextResponse.json({ data: groupListing }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to add listing" }, { status: 500 });
  }
}
