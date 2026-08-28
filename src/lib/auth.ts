import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

/** Shape returned by `authorize()` — maps onto the augmented JWT. */
interface AuthorizedUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "CALL_AGENT";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error("Identifiants invalides");
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) {
          throw new Error("Identifiants invalides");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Identifiants invalides");
        }

        const authorizedUser: AuthorizedUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };

        return authorizedUser;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authorized = user as unknown as AuthorizedUser;
        token.role = authorized.role;
        token.userId = authorized.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as "ADMIN" | "CALL_AGENT";
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});
