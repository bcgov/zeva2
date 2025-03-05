import { keycloakSignIn } from "@/app/lib/actions/keycloak";
import { Button } from "@/app/lib/components/inputs";

export default function Home() {
  const bceidSignin = keycloakSignIn.bind(null, "bceidbusiness");
  const idirSignin = keycloakSignIn.bind(null, "idir");
  return (
    <div>
      <Button onClick={bceidSignin}>Sign in with BCeID</Button>
      <br />
      <Button onClick={idirSignin}>Sign in with IDIR</Button>
    </div>
  );
}
