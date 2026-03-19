import { NextRequest, NextResponse } from "next/server";
import { authOptions, getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AppDataSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  currentAddress: z.string().optional(),
  income: z.number().int().min(0).optional(),
  employer: z.string().optional(),
  jobTitle: z.string().optional(),
  employmentYears: z.number().int().min(0).optional(),
  creditScore: z.number().int().min(300).max(850).optional(),
  hasGuarantor: z.boolean().optional(),
  guarantorName: z.string().optional(),
  guarantorEmail: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorIncome: z.number().int().min(0).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.groupMember.findFirst({
    where: { groupId: (await params).groupId, userId },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const members = await prisma.groupMember.findMany({
    where: { groupId: (await params).groupId },
    include: {
      user: {
        include: { applicationData: true },
      },
    },
  });

  return NextResponse.json({ data: members });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.groupMember.findFirst({
    where: { groupId: (await params).groupId, userId },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  try {
    const body = await req.json();
    const data = AppDataSchema.parse(body);

    const appData = await prisma.applicationData.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return NextResponse.json({ data: appData });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
