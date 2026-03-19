import { NextRequest, NextResponse } from "next/server";
import { authOptions, getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function getGroupAndVerify(groupId: string, userId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
    },
  });
  return group;
}

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await getGroupAndVerify((await paramsPromise).groupId, userId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  return NextResponse.json({ data: group });
}

const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  moveInDate: z.string().optional(),
  bedsMin: z.number().int().min(0).optional(),
  bedsMax: z.number().int().min(0).optional(),
  baths: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const group = await getGroupAndVerify((await paramsPromise).groupId, userId);
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const myMembership = group.members.find((m) => m.userId === userId);
  if (myMembership?.role === "MEMBER") {
    return NextResponse.json({ error: "Only admins can update group settings" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = UpdateGroupSchema.parse(body);

    const updated = await prisma.group.update({
      where: { id: (await paramsPromise).groupId },
      data: {
        ...data,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.groupMember.findFirst({
    where: { groupId: (await paramsPromise).groupId, userId, role: "OWNER" },
  });
  if (!member) return NextResponse.json({ error: "Only owner can delete group" }, { status: 403 });

  await prisma.group.delete({ where: { id: (await paramsPromise).groupId } });
  return NextResponse.json({ message: "Group deleted" });
}
