"use client";

import { JSX } from "react";
import { usePathname } from "next/navigation";
import { Routes } from "../constants";

export const LowerNavbarWrapper = (props: {
  type: "zevModel";
  navbar: JSX.Element;
}) => {
  const pathname = usePathname();

  switch (props.type) {
    case "zevModel":
      if (
        pathname === Routes.ActiveZevModels ||
        pathname === Routes.InactiveZevModels
      ) {
        return props.navbar;
      }
  }
  return null;
};
