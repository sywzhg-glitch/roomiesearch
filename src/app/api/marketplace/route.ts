import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const location = url.searchParams.get("location");
  const budgetMax = url.searchParams.get("budgetMax");

  const profiles = await prisma.marketplaceProfile.findMany({
    where: {
      isActive: true,
      ...(type ? { type: type as "OPEN_ROOM" | "LOOKING_FOR_GROUP" | "LOOKING_TO_JOIN" } : {}),
      ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
      ...(budgetMax ? { budgetMax: { lte: parseInt(budgetMax) } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      group: {
        include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: profiles });
}

const ProfileSchema = z.object({
  type: z.enum(["OPEN_ROOM", "LOOKING_FOR_GROUP", "LOOKING_TO_JOIN"]),
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  moveInDate: z.string().optional(),
  openRooms: z.number().int().min(1).optional(),
  groupId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const data = ProfileSchema.parse(body);

    const profile = await prisma.marketplaceProfile.upsert({
      where: data.groupId ? { groupId: data.groupId } : { userId },
      create: {
        ...data,
        userId: data.groupId ? undefined : userId,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
      },
      update: {
        ...data,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
