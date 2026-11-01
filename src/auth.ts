import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { consumeAuthAttempt } from "@/lib/auth-rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/giris", error: "/giris" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(credentials, request) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";
        if (!email || email.length > 254 || !password || password.length > 128)
          return null;
        const ip = process.env.VERCEL
          ? (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown")
          : "local";
        if (
          !(await consumeAuthAttempt("login-ip", ip, 50)) ||
          !(await consumeAuthAttempt("login-email", email))
        )
          return null;
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
          },
        });
        if (!(await verifyPassword(password, user?.password)) || !user)
          return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }
      return session;
    },
  },
});
