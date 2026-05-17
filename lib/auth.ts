import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName || user.pseudo,
          image: user.avatarUrl,
          role: user.role,
          pseudo: user.pseudo,
          fullName: user.fullName,
        } as any;
      },

    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.fullName = (user as any).fullName;
        token.pseudo = (user as any).pseudo;
        token.avatarUrl = (user as any).avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).fullName = token.fullName;
        (session.user as any).pseudo = token.pseudo;
        (session.user as any).avatarUrl = token.avatarUrl;

        // Populate standard NextAuth fields for convenience
        session.user.name = (token.fullName as string) || (token.pseudo as string) || session.user.name;
        session.user.image = (token.avatarUrl as string) || session.user.image;
      }
      return session;
    },

  },
};

