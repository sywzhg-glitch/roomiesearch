import { NextRequest, NextResponse } from "next/server";
import { authOptions, getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { applicationData: true },
    omit: { passwordHash: true },
  });

  return NextResponse.json({ data: user });
}

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      omit: { passwordHash: true },
    });
    return NextResponse.json({ data: user });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
