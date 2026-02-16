import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import {
  getActiveUserById,
  getActiveUserByProfile,
  UserWithOrg,
} from "./lib/data/user";
import { Role } from "@/prisma/generated/enums";
import { userConfiguredCorrectly } from "./app/users/lib/utilsServer";
import { NextResponse } from "next/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Keycloak],
  session: {
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    signIn: async ({ profile }) => {
      console.log("profile encountered at %s: %s", new Date(), profile);
      if (profile) {
        const user = await getActiveUserByProfile(profile);
        if (user && userConfiguredCorrectly(user)) {
          return true;
        }
      }
      return false;
    },
    jwt: async ({ token, account, profile }) => {
      const userId = token.internalId;
      if (profile || userId) {
        let user: UserWithOrg | null = null;
        if (profile) {
          user = await getActiveUserByProfile(profile);
        } else if (userId) {
          user = await getActiveUserById(userId);
        }
        if (user && userConfiguredCorrectly(user)) {
          token.internalId = user.id;
          token.roles = user.roles;
          token.isGovernment = user.organization.isGovernment;
          token.organizationId = user.organizationId;
          token.organizationName = user.organization.name;
          if (account) {
            token.idToken = account.id_token;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.internalId = token.internalId;
      session.user.idToken = token.idToken;
      session.user.roles = token.roles;
      session.user.isGovernment = token.isGovernment;
      session.user.organizationId = token.organizationId;
      session.user.organizationName = token.organizationName;
      return session;
    },
    authorized: async ({ auth, request: { nextUrl } }) => {
      const pathname = nextUrl.pathname;
      const user = auth?.user;
      if (pathname === "/") {
        if (user) {
          return NextResponse.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      if (!user) {
        return NextResponse.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
});

export interface UserInfo {
  userId: number;
  userIsGov: boolean;
  userOrgId: number;
  userRoles: Role[];
  userOrgName: string;
  userIdToken: string;
}

export const getUserInfo = async (): Promise<UserInfo> => {
  const session = await auth();
  const user = session?.user;
  return {
    userId: user?.internalId ?? -1,
    userIsGov: user?.isGovernment ?? false,
    userOrgId: user?.organizationId ?? -1,
    userRoles: user?.roles ?? [],
    userOrgName: user?.organizationName ?? "",
    userIdToken: user?.idToken ?? "",
  };
};
