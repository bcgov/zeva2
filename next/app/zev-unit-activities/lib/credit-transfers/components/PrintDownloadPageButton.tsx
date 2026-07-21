"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";

export const PrintDownloadPageButton = () => (
  <button
    type="button"
    onClick={() => window.print()}
    className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-primaryText hover:bg-gray-50"
  >
    <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
    Print / Download Page
  </button>
);
