"use server";

import { getUserInfo, signIn, signOut } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const keycloakSignIn = async (idpHint: string) => {
  await signIn("keycloak", undefined, { kc_idp_hint: idpHint });
};

const keycloakSignOut = async () => {
  const { userIsGov, userIdToken } = await getUserInfo();
  const keycloakUrl = process.env.AUTH_KEYCLOAK_ISSUER;
  const keycloakClient = process.env.AUTH_KEYCLOAK_ID;
  if (userIdToken && keycloakUrl && keycloakClient) {
    let url =
      keycloakUrl +
      "/protocol/openid-connect/logout" +
      "?client_id=" +
      encodeURIComponent(keycloakClient) +
      "&id_token_hint=" +
      encodeURIComponent(userIdToken);
    if (userIsGov) {
      // when using the azureidir IDP, calling the above logout url from the server
      // doesn't seem to work, so we do:
      const headersList = await headers();
      const origin = headersList.get("origin");
      url =
        url +
        "&post_logout_redirect_uri=" +
        encodeURIComponent(`${origin}/api/signOut`);
      redirect(url);
    } else {
      await fetch(url);
      await signOut({ redirectTo: "/" });
    }
  }
};

export { keycloakSignIn, keycloakSignOut };
