import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function getUserId(session: { user?: { id?: string } } | null): string | null {
  return session?.user?.id ?? null;
}

/**
 * Dual-auth helper for API routes.
 * Supports both:
 *   1. Mobile: Authorization: Bearer <JWT signed with NEXTAUTH_SECRET>
 *   2. Web: NextAuth session cookie (getServerSession fallback)
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  // 1. Try Bearer token (mobile app)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return (payload as { id: string }).id ?? null;
    } catch {
      return null;
    }
  }
  // 2. Fall back to NextAuth session cookie (web app)
  const session = await getServerSession(authOptions);
  return session?.user ? (session.user as { id: string }).id : null;
}
