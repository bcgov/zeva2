import { Row } from "./layout";
import { fetchBalance } from "../services/balance";
import {
  TransactionType,
  VehicleClass,
  ZevClass,
} from "@/prisma/generated/enums";
import { sumBalance } from "@/lib/utils/zevUnit";
import { getUserInfo } from "@/auth";
import { PrimaryNavbar } from "./PrimaryNavbar";

/** Basic Header component containing the BCGOV logo and title of the application. */
export const Header = async () => {
  const { userName, userIsGov, userOrgName, userOrgId, userRoles, userId } =
    await getUserInfo();

  let balance: Awaited<ReturnType<typeof fetchBalance>>;
  if (!userIsGov) {
    balance = await fetchBalance(userOrgId);
  }

  const sumCreditsForClass = (zevClass: ZevClass) => {
    if (!balance) {
      return "0.00";
    }
    if (balance === "deficit") {
      return "Deficit";
    }
    return sumBalance(
      balance,
      TransactionType.CREDIT,
      VehicleClass.REPORTABLE,
      zevClass,
    ).toFixed(2);
  };

  return (
    <div className="w-full flex flex-col">
      <Row className="w-full bg-primaryBlue items-center px-4 text-white">
        <img
          className="h-[5rem] w-[12.5rem] mr-4"
          src="/bcgov_white_text.png"
          alt="BC GOV logo"
        />
        <span className="text-xl">Zero-Emission Vehicles Reporting System</span>
        {userIsGov ? (
          <div className="ml-auto flex items-center gap-4 text-sm sm:text-base">
            {userOrgName && (
              <span className="font-semibold">{userOrgName}</span>
            )}
            {userOrgName && <span className="h-6 border-l border-white/70" />}
            <span className="font-semibold">{userName}</span>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-4 text-sm sm:text-base">
            {userOrgName && (
              <span className="font-semibold">{userOrgName}</span>
            )}
            {(balance || userOrgName) && (
              <span className="h-8 border-l border-white/70" />
            )}
            {balance === "deficit" ? (
              <span className="font-semibold">Deficit</span>
            ) : (
              <div className="flex flex-col leading-tight text-right items-end font-semibold tabular-nums gap-1">
                <div className="grid grid-cols-[3rem_minmax(0,6.5rem)] gap-x-1 items-center">
                  <span className="justify-self-end">A -</span>
                  <span className="text-left tabular-nums">
                    {sumCreditsForClass(ZevClass.A)}
                  </span>
                </div>
                <div className="grid grid-cols-[3rem_minmax(0,6.5rem)] gap-x-1 items-center">
                  <span className="justify-self-end">B -</span>
                  <span className="text-left tabular-nums">
                    {sumCreditsForClass(ZevClass.B)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Row>
      {userId !== -1 && (
        <PrimaryNavbar
          userIsGov={userIsGov}
        />
      )}
    </div>
  );
};
