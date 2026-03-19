import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAISuggestions } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    const { groupId } = await req.json();

    const group = await prisma.group.findFirst({
      where: { id: groupId, members: { some: { userId } } },
    });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const suggestions = await getAISuggestions(group);
    return NextResponse.json({ data: suggestions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
