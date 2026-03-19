import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ groupListingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const gl = await prisma.groupListing.findFirst({
    where: {
      id: (await paramsPromise).groupListingId,
      group: { members: { some: { userId } } },
    },
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
      group: { include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } } },
    },
  });

  if (!gl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: gl });
}

const UpdateStatusSchema = z.object({
  status: z.enum(["CONSIDERING", "APPLYING", "APPLIED", "REJECTED", "SIGNED"]),
});

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupListingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const gl = await prisma.groupListing.findFirst({
    where: { id: (await paramsPromise).groupListingId, group: { members: { some: { userId } } } },
  });
  if (!gl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const { status } = UpdateStatusSchema.parse(body);
    const updated = await prisma.groupListing.update({
      where: { id: (await paramsPromise).groupListingId },
      data: { status },
      include: { listing: true, ratings: true, comments: true },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params: paramsPromise }: { params: Promise<{ groupListingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const gl = await prisma.groupListing.findFirst({
    where: { id: (await paramsPromise).groupListingId, group: { members: { some: { userId } } } },
  });
  if (!gl) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.groupListing.delete({ where: { id: (await paramsPromise).groupListingId } });
  return NextResponse.json({ message: "Removed" });
}
