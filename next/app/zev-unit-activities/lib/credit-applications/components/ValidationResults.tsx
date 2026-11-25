"use client";

import { Button, StatusBanner } from "@/app/lib/components";
import { downloadBuffer } from "@/app/lib/utils/download";
import {
  faDownload,
  faSquareCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Excel from "exceljs";
import { useCallback } from "react";

export const ValidationResults = (props: {
  eligibleWorkbook: Excel.Workbook | null;
  eligibleCount: number;
  ineligibleWorkbook: Excel.Workbook | null;
  ineligibleCount: number;
  disabled: boolean;
}) => {
  const handleDownload = useCallback(
    async (type: "eligible" | "ineligible") => {
      const eligibleWorkbook = props.eligibleWorkbook;
      const ineligibleWorkbook = props.ineligibleWorkbook;
      if (type === "eligible" && eligibleWorkbook !== null) {
        const recordsBuf = await eligibleWorkbook.xlsx.writeBuffer();
        downloadBuffer("eligible-records.xlsx", recordsBuf);
      } else if (type === "ineligible" && ineligibleWorkbook !== null) {
        const recordsBuf = await ineligibleWorkbook.xlsx.writeBuffer();
        downloadBuffer("ineligible-records.xlsx", recordsBuf);
      }
    },
    [props.eligibleWorkbook, props.ineligibleWorkbook],
  );

  return (
    <div className="flex flex-col rounded border border-dividerMedium">
      <h2 className="px-5 py-4 bg-disabledBG text-xl font-bold">
        Validation Results
      </h2>
      <hr className="border-dividerMedium"></hr>
      <div className="px-5 py-4 bg-whiteSmoke">
        <StatusBanner
          variant="info"
          title=""
          primaryText="Your Credit Application contains one or more VIN records that could not be validated. To help you continue, the system has separated your uploaded records into two files:"
          secondaryText={
            <span className="flex flex-col">
              <span>
                <span className="font-bold">1. Eligible Records - </span>{" "}
                contains VIN records that successfully passed validation and can
                be submitted as part of this Credit Application.
              </span>
              <span>
                <span className="font-bold">2. Ineligible Records - </span>{" "}
                contains VIN records that could not be validated. This file
                includes the applicable error code and explanation for each
                invalid record.
              </span>
            </span>
          }
        />
      </div>
      <hr className="border-dividerMedium"></hr>
      <div className="flex flex-col gap-4 px-5 py-4 bg-whiteSmoke">
        <span></span>
        <ol className="list-decimal list-inside">
          <li>
            Download both the{" "}
            <span className="font-bold">Eligible Records</span> file (if
            applicable) and the{" "}
            <span className="font-bold">Ineligible Records</span> file.
          </li>
          <li>
            Save the file(s) to your device. Once you upload a replacement file,
            these validation result files will no longer be available for
            download.
          </li>
          <li>
            Review the Invalid Records file and the associated error messages.
          </li>
          <li>
            In the Credit Application Details section, delete the file that is
            currently uploaded.
          </li>
          <li>
            If applicable, upload the{" "}
            <span className="font-bold">Eligible Records</span> file.
            Alternatively, review and correct the records within the{" "}
            <span className="font-bold">Ineligible Records</span> file, and
            upload that.
          </li>
          <li>Continue with your Credit Application.</li>
        </ol>
      </div>
      <hr className="border-dividerMedium"></hr>
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-row items-center gap-6">
          <div className="flex flex-col gap-6">
            <span className="flex flex-row items-center justify-between">
              <span className="flex flex-row items-center gap-3">
                <FontAwesomeIcon
                  icon={faSquareCheck}
                  className="text-success"
                />
                <span className="font-bold">Eligible VIN Count:</span>
              </span>
              <span>{props.eligibleCount}</span>
            </span>
            <Button
              icon={<FontAwesomeIcon icon={faDownload} />}
              variant="secondary"
              disabled={props.eligibleWorkbook === null || props.disabled}
              onClick={() => handleDownload("eligible")}
            >
              <span className="font-bold">
                Download <span className="text-success">Eligible</span> Records
              </span>
            </Button>
          </div>
          <div className="w-px h-full bg-disabledBG"></div>
          <div className="flex flex-col gap-6">
            <span className="flex flex-row items-center justify-between">
              <span className="flex flex-row items-center gap-3">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="text-error"
                />
                <span className="font-bold">Ineligible VIN Count:</span>
              </span>
              <span>{props.ineligibleCount}</span>
            </span>
            <Button
              icon={<FontAwesomeIcon icon={faDownload} />}
              variant="secondary"
              disabled={props.ineligibleWorkbook === null || props.disabled}
              onClick={() => handleDownload("ineligible")}
            >
              <span className="font-bold">
                Download <span className="text-error">Ineligible</span> Records
              </span>
            </Button>
          </div>
        </div>
        <StatusBanner
          variant="warning"
          title="Important!"
          primaryText={
            props.eligibleCount > 0 ? (
              <span>
                To continue with this Credit Application, upload the{" "}
                <span className="font-bold">Eligible Records</span> file. Only
                the{" "}
                <span className="font-bold">
                  {props.eligibleCount} valid VIN record(s)
                </span>{" "}
                can proceed through this Credit Application. Invalid records
                cannot be included and should be reviewed and corrected for
                future submissions.
              </span>
            ) : (
              <span>
                To continue with this Credit Application, please review and
                correct the records within the{" "}
                <span className="font-bold">Ineligible Records</span> file, and
                upload it.
              </span>
            )
          }
        />
      </div>
    </div>
  );
};
