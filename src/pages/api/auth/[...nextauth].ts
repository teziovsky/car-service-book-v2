import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { verify } from "argon2";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";

import { env } from "@/env/server.mjs";
import { prisma } from "@/server/db/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "",
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Address email",
          type: "email",
          placeholder: "john@doe.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        if (!user?.hash || !credentials?.password) {
          return null;
        }

        const isValidPassword = await verify(user.hash, credentials.password);

        if (!isValidPassword) {
          return null;
        }

        const { hash, ...userWithoutHash } = user;

        return userWithoutHash;
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async redirect({ baseUrl }) {
      return `${baseUrl}/app`;
    },
    async jwt({ token }) {
      if (token.email) {
        const existingUser = await prisma.user.findUnique({
          where: {
            email: token?.email?.toLowerCase(),
          },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        });

        if (existingUser) {
          return {
            user: existingUser,
          };
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.user) {
        session.user = token.user;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export default NextAuth(authOptions);
