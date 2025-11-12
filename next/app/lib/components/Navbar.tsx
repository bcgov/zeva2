"use client";

import React, { useEffect } from "react";
import { MenuItem, NavbarSubItems } from "../constants/navbarItems";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { keycloakSignOut } from "../actions/keycloak";
import { Row } from "./layout";

/** Client Component used for navigation */
export const Navbar: React.FC<{
  userName: string;
  mainItems: MenuItem[];
  subItems: NavbarSubItems;
}> = ({ userName, mainItems, subItems }) => {
  const pathname = usePathname();

  /**
   * Check if the current pathname matches a route
   *    and extract numeric parameters if any.
   * @param route - The route to check against the current pathname.
   * @returns an object of parameters if the route matches,
   *    or undefined if it does not match.
   */
  const checkRoute = (route: string) => {
    const params: Record<string, string> = {};
    const pathnameParts = pathname.split("/");
    const routeParts = route.split("/");
    if (pathnameParts.length < routeParts.length) {
      return undefined;
    }
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        if (!isNaN(parseInt(pathnameParts[i], 10))) {
          params[routeParts[i].slice(1)] = pathnameParts[i];
          continue;
        }
      }
      if (routeParts[i] !== pathnameParts[i]) {
        return undefined;
      }
    }
    return params;
  };

  const [activeLabel, setActiveLabel] = React.useState<string | undefined>(
    undefined,
  );
  const [activeSubMenu, setActiveSubMenu] = React.useState<
    MenuItem[] | undefined
  >(undefined);
  const [showUserDropDown, setShowUserDropDown] = React.useState(false);

  /**
   * Find the first sub-menu with at least one item having a route matching
   *    the pattern of the current pathname. Then return that sub-menu with
   *    all routes having the parameters replaced with the actual values.
   * @param menus - An array of sub-menus to search for.
   * @returns the first sub-menu with an item matching the current pathname,
   *    with parameters replaced; or an empty array if no match is found.
   */
  const findMenuMatchingPathname = (menus: NavbarSubItems) => {
    for (const label in menus) {
      const menu = menus[label];
      for (const item of menu) {
        const params = checkRoute(item.route);
        if (params) {
          // Return the menu with params in all routes replaced with the actual values
          return {
            label,
            menu: menu.map((item) => {
              let newRoute = item.route;
              Object.entries(params).forEach(([key, value]) => {
                newRoute = newRoute.replace(`:${key}`, value);
              });
              return { ...item, route: newRoute };
            }),
          };
        }
      }
    }
    return {};
  };

  useEffect(() => {
    const { label, menu } = findMenuMatchingPathname(subItems);
    setActiveLabel(
      label ?? mainItems.find((item) => checkRoute(item.route))?.label,
    );
    setActiveSubMenu(menu);
  }, [pathname, mainItems, subItems]);

  return (
    <>
      <Row className="w-full bg-primaryBlueHover border-t-2 border-primaryGold mr-[16rem] px-1 mb-3 text-white">
        {mainItems.map((item) => (
          <Link
            key={item.label}
            className={
              "cursor-pointer px-2" +
              (activeLabel === item.label
                ? " border-b-2 border-primaryYellow"
                : "")
            }
            href={item.route}
          >
            {item.label}
          </Link>
        ))}

        <div className="ml-auto relative">
          <div
            onClick={() => setShowUserDropDown(!showUserDropDown)}
            className="cursor-pointer flex flex-row items-center"
          >
            {userName}
            {!showUserDropDown ? (
              <FaAngleDown className="mt-[0.5px] ml-1" />
            ) : (
              <FaAngleUp className="mt-[0.5px] ml-1" />
            )}
          </div>
          {showUserDropDown && (
            <div
              onClick={keycloakSignOut}
              className="absolute right-0 bg-primaryBlue hover:bg-primaryBlueHover border mt-[0.5px] p-2 shadow-lg cursor-pointer"
            >
              Sign Out
            </div>
          )}
        </div>
      </Row>

      {activeSubMenu && (
        <Row className="m-2 border-b border-dividerMedium">
          {activeSubMenu.map((item, index) => (
            <Link
              key={index}
              className={
                "p-3 border border-dividerMedium hover:bg-primaryBlueHover" +
                (checkRoute(item.route)
                  ? " bg-blue-50 font-semibold text-primaryText border-dividerDark hover:bg-primaryBlueHover"
                  : "")
              }
              href={item.route}
            >
              {item.label}
            </Link>
          ))}
        </Row>
      )}
    </>
  );
};
