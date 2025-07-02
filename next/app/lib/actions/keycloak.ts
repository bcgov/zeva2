"use server";

import { auth, signIn, signOut } from "@/auth";

const keycloakSignIn = async (idpHint: string) => {
  await signIn("keycloak", undefined, { kc_idp_hint: idpHint });
};

const keycloakSignOut = async () => {
  const session = await auth();
  const idToken = session?.user?.idToken;
  const keycloakUrl = process.env.AUTH_KEYCLOAK_ISSUER;
  const keycloakClient = process.env.AUTH_KEYCLOAK_ID;
  if (idToken && keycloakUrl && keycloakClient) {
    //next-auth doesn't sign you out from keycloak; it just terminates the next-auth session
    //see https://github.com/nextauthjs/next-auth/discussions/3938; so we do:
    const url =
      keycloakUrl +
      "/protocol/openid-connect/logout" +
      "?client_id=" +
      encodeURIComponent(keycloakClient) +
      "&id_token_hint=" +
      encodeURIComponent(idToken);
    try {
      await fetch(url);
    } catch (error) {
      console.log("error logging out of keycloak");
    }
  }
  await signOut({ redirectTo: "/" });
};

export { keycloakSignIn, keycloakSignOut };
