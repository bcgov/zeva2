import React from "react";
import { Navbar } from "./Navbar";
import { Session } from "next-auth";

export interface IHeaderProps {
  session: Session;
}
/** Basic Header component containing the BCGOV logo and title of the application. */
export const Header: React.FC<IHeaderProps> = ({ session }) => {
  return (
    <div className="w-full flex flex-col">
      <div className="w-full bg-primaryBlue flex flex-row items-center px-4 text-white">
        <img
          className="h-[5rem] w-[12.5rem] mr-4"
          src="/bcgov_white_text.png"
          alt="BC GOV logo"
        />
        <span className="text-xl">Zero-Emission Vehicles Reporting System</span>
        <span className="ml-auto">Government of British Columbia</span>
      </div>
      <Navbar user={session.user ?? ""} />
    </div>
  );
};
