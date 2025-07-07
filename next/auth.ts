import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { getActiveUser, resetFlag } from "./lib/data/user";
import { Role } from "@/prisma/generated/client";
import { userConfiguredCorrectly } from "./app/users/lib/utils";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Keycloak],
  session: {
    maxAge: 60 * 60 * 8,
  },
  callbacks: {
    signIn: async ({ profile }) => {
      console.log("profile encountered at %s: %s", new Date(), profile);
      const user = await getActiveUser(profile);
      if (user && userConfiguredCorrectly(user)) {
        await resetFlag(user.id);
        return true;
      }
      return false;
    },
    jwt: async ({ token, account, profile, trigger }) => {
      if (trigger === "signIn") {
        token.idToken = account?.id_token;
        const user = await getActiveUser(profile);
        if (user) {
          token.internalId = user.id;
          token.roles = user.roles;
          token.isGovernment = user.organization.isGovernment;
          token.organizationId = user.organizationId;
          token.organizationName = user.organization.name;
        }
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
      // prisma does not work in edge runtime, which is what nextjs middleware uses,
      // so we do the below for now. When there's a stable release of nextjs that supports
      // node runtime for middleware, we'll update this so that we don't have to do the "roundabout"
      // fetch to the api endpoint. Support for node runtime in middleware is currently available in
      // the canary version of nextjs: https://github.com/vercel/next.js/pull/75624
      if (user && user.internalId) {
        const response = await fetch(
          `http://localhost:3000/api/user?id=${user.internalId}`,
        );
        const data = await response.json();
        if (data.signOut) {
          return Response.redirect(new URL("/signOut", nextUrl));
        }
      }
      if (pathname === "/") {
        if (user) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      if (!user) {
        return Response.redirect(new URL("/", nextUrl));
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
