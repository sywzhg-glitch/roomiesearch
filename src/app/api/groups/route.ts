import { NextRequest, NextResponse } from "next/server";
import { authOptions, getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const CreateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  location: z.string().optional(),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),
  moveInDate: z.string().optional(),
  bedsMin: z.number().int().min(0).optional(),
  bedsMax: z.number().int().min(0).optional(),
  baths: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      _count: { select: { listings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: groups });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = CreateGroupSchema.parse(body);

    const group = await prisma.group.create({
      data: {
        name: data.name,
        inviteCode: uuidv4().slice(0, 12),
        location: data.location,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : undefined,
        bedsMin: data.bedsMin,
        bedsMax: data.bedsMax,
        baths: data.baths,
        notes: data.notes,
        members: { create: { userId, role: "OWNER" } },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      },
    });

    return NextResponse.json({ data: group }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
