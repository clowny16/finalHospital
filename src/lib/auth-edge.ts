import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

/**
 * Edge-compatible auth config.
 * This module is imported by middleware and must NOT import any Node.js-only modules.
 * Prisma/bcrypt verification happens only in the full auth.ts (server components / API routes).
 */
export const { auth: middlewareAuth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // No authorize here — middleware only reads the session JWT, it doesn't authenticate
      async authorize() { return null },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
})
