import React from "react";

/** Basic Header component containing the BCGOV logo and title of the application. */
export const Header: React.FC = () => {
  return (
    <div className="w-full bg-primaryBlue flex flex-row items-center px-4 text-white">
      <img
        className="h-30 w-60 mr-4"
        src="/bcgov_white_text.png"
        alt="BC GOV logo"
      />
      <span className="text-xl">Zero-Emission Vehicles Reporting System</span>
      <span className="ml-auto">Government of British Columbia</span>
    </div>
  );
};
