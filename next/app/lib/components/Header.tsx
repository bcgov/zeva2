import React from "react";
import { Navbar } from "./Navbar";
import { Session } from "next-auth";
import { Row } from "./layout";
import {
  navbarMainItems,
  navbarSubItems,
  MenuItem,
  NavbarSubItems,
} from "../constants/navbarItems";
import { fetchBalance } from "../services/balance";
import { TransactionType, ZevClass } from "@/prisma/generated/enums";
import { Decimal } from "decimal.js";

export interface IHeaderProps {
  session: Session;
}

/** Basic Header component containing the BCGOV logo and title of the application. */
export const Header = async ({ session }: IHeaderProps) => {
  const userName = session.user?.name ?? "User";
  const organizationName = session.user?.organizationName ?? "";
  const organizationId = session.user?.organizationId ?? null;
  const isGovernment = session.user?.isGovernment ?? false;
  const userRoles = session.user?.roles ?? [];

  let balance: Awaited<ReturnType<typeof fetchBalance>>;
  if (!isGovernment && organizationId > 0) {
    balance = await fetchBalance(organizationId);
  }

  const sumCreditsForClass = (zevClass: ZevClass) => {
    if (!balance || balance === "deficit") {
      return new Decimal(0);
    }
    const creditBalances = balance[TransactionType.CREDIT] ?? {};
    let total = new Decimal(0);
    Object.values(creditBalances).forEach((byZevClass) => {
      const zevMap = (byZevClass as any)[zevClass] ?? {};
      Object.values(zevMap).forEach((val) => {
        total = total.plus(new Decimal(val));
      });
    });
    return total;
  };

  const formatCredits = (value: Decimal) => value.toFixed(2);
  const filterByRoles = (items: MenuItem[]) =>
    items.filter(
      (item) =>
        !item.roles || item.roles.some((role) => userRoles.includes(role)),
    );
  const filteredSubItems = (items: NavbarSubItems) => {
    const filtered: NavbarSubItems = {};
    for (const label in items) {
      const subItems = filterByRoles(items[label]);
      if (subItems.length > 0) {
        filtered[label] = subItems;
      }
    }
    return filtered;
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
        {isGovernment ? (
          <div className="ml-auto flex items-center gap-4 text-sm sm:text-base">
            {organizationName && (
              <span className="font-semibold">{organizationName}</span>
            )}
            {organizationName && (
              <span className="h-6 border-l border-white/70" />
            )}
            <span className="font-semibold">{userName}</span>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-4 text-sm sm:text-base">
            {organizationName && (
              <span className="font-semibold">{organizationName}</span>
            )}
            {(balance || organizationName) && (
              <span className="h-8 border-l border-white/70" />
            )}
            <div className="flex flex-col leading-tight text-right items-end font-semibold tabular-nums gap-1">
              <div className="grid grid-cols-[3rem_minmax(0,6.5rem)] gap-x-1 items-center">
                <span className="justify-self-end">A -</span>
                <span className="text-left tabular-nums">
                  {formatCredits(sumCreditsForClass(ZevClass.A))}
                </span>
              </div>
              <div className="grid grid-cols-[3rem_minmax(0,6.5rem)] gap-x-1 items-center">
                <span className="justify-self-end">B -</span>
                <span className="text-left tabular-nums">
                  {formatCredits(sumCreditsForClass(ZevClass.B))}
                </span>
              </div>
            </div>
          </div>
        )}
      </Row>
      {session.user && (
        <Navbar
          mainItems={filterByRoles(navbarMainItems)}
          subItems={filteredSubItems(navbarSubItems)}
        />
      )}
    </div>
  );
};
