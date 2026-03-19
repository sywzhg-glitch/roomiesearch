import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params: paramsPromise }: { params: Promise<{ inviteCode: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const group = await prisma.group.findUnique({ where: { inviteCode: (await paramsPromise).inviteCode } });
  if (!group) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });
  if (existing) {
    return NextResponse.json({ data: { groupId: group.id, alreadyMember: true } });
  }

  await prisma.groupMember.create({
    data: { userId, groupId: group.id, role: "MEMBER" },
  });

  return NextResponse.json({ data: { groupId: group.id, alreadyMember: false } }, { status: 201 });
}

export async function GET(_: NextRequest, { params: paramsPromise }: { params: Promise<{ inviteCode: string }> }) {
  const group = await prisma.group.findUnique({
    where: { inviteCode: (await paramsPromise).inviteCode },
    select: { id: true, name: true, location: true, _count: { select: { members: true } } },
  });
  if (!group) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  return NextResponse.json({ data: group });
}
