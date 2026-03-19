import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Join via invite code (public) or groupId (member)
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ groupId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const group = await prisma.group.findUnique({ where: { id: (await paramsPromise).groupId } });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });
  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 400 });

  const member = await prisma.groupMember.create({
    data: { userId, groupId: group.id, role: "MEMBER" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: member }, { status: 201 });
}
