import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Sign a 30-day JWT using the same NEXTAUTH_SECRET — no extra secret to manage
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const token = await new SignJWT({ id: user.id, email: user.email, name: user.name })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
