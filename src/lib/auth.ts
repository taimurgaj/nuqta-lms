import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "برقی خط", type: "email" },
        password: { label: "خفیہ رمز", type: "password" },
        orgSlug: { label: "ادارہ", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { org: { select: { name: true, slug: true, tier: true } } },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId ?? null,
          isOrgAdmin: user.isOrgAdmin,
          orgName: user.org?.name ?? null,
          orgSlug: user.org?.slug ?? null,
          orgTier: user.org?.tier ?? "pilot",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          role?: string; id?: string;
          orgId?: string | null; isOrgAdmin?: boolean;
          orgName?: string | null; orgSlug?: string | null; orgTier?: string;
        };
        token.role = u.role;
        token.id = u.id;
        token.orgId = u.orgId ?? null;
        token.isOrgAdmin = u.isOrgAdmin ?? false;
        token.orgName = u.orgName ?? null;
        token.orgSlug = u.orgSlug ?? null;
        token.orgTier = u.orgTier ?? "pilot";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as Record<string, unknown>;
        u.role = token.role;
        u.id = token.id;
        u.orgId = token.orgId ?? null;
        u.isOrgAdmin = token.isOrgAdmin ?? false;
        u.orgName = token.orgName ?? null;
        u.orgSlug = token.orgSlug ?? null;
        u.orgTier = token.orgTier ?? "pilot";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
