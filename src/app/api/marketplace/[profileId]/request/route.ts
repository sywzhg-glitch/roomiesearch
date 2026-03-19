import { NextRequest, NextResponse } from "next/server";
import { authOptions, getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RequestSchema = z.object({ message: z.string().optional() });

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ profileId: string }> }) {
  const userId = await getAuthUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.marketplaceProfile.findUnique({ where: { id: (await paramsPromise).profileId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  if (profile.userId === userId) return NextResponse.json({ error: "Cannot request your own profile" }, { status: 400 });

  try {
    const body = await req.json();
    const { message } = RequestSchema.parse(body);

    const existing = await prisma.marketplaceRequest.findFirst({
      where: { fromUserId: userId, toProfileId: (await paramsPromise).profileId },
    });
    if (existing) return NextResponse.json({ error: "Request already sent" }, { status: 409 });

    const request = await prisma.marketplaceRequest.create({
      data: { fromUserId: userId, toProfileId: (await paramsPromise).profileId, message },
      include: { fromUser: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ data: request }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
