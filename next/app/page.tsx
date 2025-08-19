import { keycloakSignIn } from "@/app/lib/actions/keycloak";
import { Button } from "@/app/lib/components/inputs";
import Image from "next/image";
export default function Home() {
  const bceidSignin = keycloakSignIn.bind(null, "bceidbusiness");
  const idirSignin = keycloakSignIn.bind(null, "azureidir");
  const buttonStyles = "text-2xl p-4 rounded-lg w-full";
  return (
    <main
      id="login-page"
      className="h-screen bg-[url('../public/bg.jpg')] bg-no-repeat bg-center bg-cover h-screen m-0 p-0 overflow-hidden relative"
    >
      <div className="grid grid-cols-1 grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-[30%_70%] h-full">
        <div className="bg-white bg-opacity-80 md:h-full order-2 md:order-1">
          {/* desktop logo */}
          <Image
            src="/BCID_H_rgb_pos.png"
            alt="BC Logo"
            width={300}
            height={100}
            className="mx-auto hidden md:block md:w-[95%] h-auto"
          />
          {/* mobile logo */}
          <Image
            src="/BCID_V_rgb_pos.png"
            alt="BC Logo"
            width={200}
            height={80}
            className="mx-auto md:hidden w-[50%] h-auto"
          />
          <div className="text-center p-[2.5rem]">
            <div className="section-title">Vehicle Suppliers</div>
            <Button onClick={bceidSignin} className={buttonStyles}>
              <div className="flex items-center gap-2 justify-center">
                <span>Login with </span>
                <img
                  id="bceid-logo"
                  alt="BCeID"
                  src="/bceid.png"
                  className="h-[1.5rem]"
                />
              </div>
            </Button>
            <br />
            <div className="section-title">Government</div>
            <Button
              onClick={idirSignin}
              className={`${buttonStyles} white-button`}
            >
              <span>Login with </span>
              <span className="font-bold">IDIR</span>
            </Button>
          </div>
        </div>

        <div className="header bg-[rgb(0,51,102)] order-1 py-2 relative top-0 md:top-8 md:bg-transparent md:h-full md:p-4">
          <div
            id="title"
            className="text-l text-center font-bold  text-shadow  md:text-4xl md:pl-10 md:text-left text-[#f2f2f2]"
          >
            Zero-Emission Vehicles Reporting System
          </div>
        </div>
      </div>
    </main>
  );
}
