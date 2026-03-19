import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  parentId: z.string().optional(),
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
    const { content, parentId } = CommentSchema.parse(body);

    const comment = await prisma.listingComment.create({
      data: { groupListingId: (await paramsPromise).groupListingId, userId, content, parentId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        replies: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    await prisma.groupListing.update({
      where: { id: (await paramsPromise).groupListingId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Comment failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupListingId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const url = new URL(req.url);
  const commentId = url.searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const comment = await prisma.listingComment.findFirst({
    where: { id: commentId, userId },
  });
  if (!comment) return NextResponse.json({ error: "Not found or not authorized" }, { status: 404 });

  await prisma.listingComment.delete({ where: { id: commentId } });
  return NextResponse.json({ message: "Deleted" });
}
