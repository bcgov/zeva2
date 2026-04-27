import { Routes } from "@/app/lib/constants";
import { fetchBalance } from "@/app/lib/services/balance";
import { sumCreditsForClass } from "@/app/lib/utils/balance";
import { getRoleEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { getUserInfo } from "@/auth";
import { ZevClass } from "@/prisma/generated/enums";
import Link from "next/link";

export const UserInformationPanel = async () => {
  const { userIsGov, userOrgId, userRoles, userOrgName } = await getUserInfo();
  if (userIsGov) {
    // todo
    return null;
  }
  let balanceJSX;
  const balance = await fetchBalance(userOrgId);
  const aCredits = sumCreditsForClass(balance, ZevClass.A);
  const bCredits = sumCreditsForClass(balance, ZevClass.B);
  if (aCredits === "Deficit" || bCredits === "Deficit") {
    balanceJSX = <span>Deficit</span>;
  } else {
    balanceJSX = (
      <div className="flex flex-col gap-2">
        <span>A: {aCredits}</span>
        <span>B: {bCredits}</span>
      </div>
    );
  }
  const rolesMap = getRoleEnumsToStringsMap();
  const roles = userRoles.map((role) => rolesMap[role]).join(", ");
  return (
    <div className="flex flex-col gap-4 border border-dividerDark">
      <div className="flex flex-col gap-2 p-2 divide-y divide-dividerMedium border border-dividerMedium">
        <div className="flex flex-col gap-2">
          <span>Legal Name: {userOrgName}</span>
          <span>Role(s): {roles}</span>
        </div>
        <Link
          href={
            "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/19029"
          }
          className="text-link"
        >
          Zero-Emission Vehicles Act
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-2 divide-y divide-dividerMedium border border-dividerMedium">
        <span>{`Your ${(<Link href={Routes.ZevUnitTransactions}>Credit Balance</Link>)}`}</span>
        {balanceJSX}
      </div>
      <div className="flex flex-col gap-2 p-2 divide-y divide-dividerMedium border border-dividerMedium">
        <span>We want to hear from you!</span>
        <p>
          We are always striving to improve the ZEV Reporting System. Please
          send your suggestions and feedback.
        </p>
        <span>
          Contact Information:{" "}
          <a href="mailto:zevregulation@gov.bc.ca" className="text-link">
            zevregulation@gov.bc.ca
          </a>
        </span>
      </div>
    </div>
  );
};
