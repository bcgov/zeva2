import React from "react";
import { Navbar } from "./Navbar";
import { Session } from "next-auth";
import { Row } from "./layout";
import {
  navbarMainItems,
  navbarSubItems,
  MenuItem,
  NavbarSubItems
} from "../constants/navbarItems";

export interface IHeaderProps {
  session: Session;
}

/** Basic Header component containing the BCGOV logo and title of the application. */
export const Header: React.FC<IHeaderProps> = ({ session }) => {
  const userRoles = session.user?.roles ?? [];
  const filterByRoles = (items: MenuItem[]) =>
    items.filter(item =>
      !item.roles ||
      item.roles.some(role => userRoles.includes(role))
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
        <span className="ml-auto">{session.user?.organizationName}</span>
      </Row>
      {session.user &&
        <Navbar
          mainItems={filterByRoles(navbarMainItems)}
          subItems={filteredSubItems(navbarSubItems)}
          userName={session.user?.name ?? "User"}
        />
      }
    </div>
  );
};
