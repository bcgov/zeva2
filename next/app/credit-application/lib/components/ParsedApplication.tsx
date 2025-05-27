"use client";

import Excel from "exceljs";
import { useState, useEffect, useCallback, useMemo, JSX } from "react";
import { getHeadersToColsMap } from "../utils";
import { Decimal } from "@prisma/client/runtime/index-browser.js";
import {
  GovTemplateCurableVinsHeaderNames,
  GovTemplateSheetNames,
  GovTemplateValidVinsHeaderNames,
  SheetStructure,
} from "../constants";

export type CreditsPayload = Record<
  "vehicleClass" | "zevClass" | "modelYear" | "numberOfCredits",
  string
>[];

export const ParsedApplication = (props: {
  workbook: Excel.Workbook;
  sendCreditsUpstream?: (credits: CreditsPayload) => void;
  sendVinsUpstream?: (vins: string[]) => void;
}) => {
  const [credits, setCredits] = useState<CreditsPayload>([]);
  const [error, setError] = useState<string>("");

  const updateCredits = useCallback(
    (
      creditsPayload: CreditsPayload,
      vehicleClass: string,
      zevClass: string,
      modelYear: string,
      numberOfCredits: string,
    ) => {
      const index = creditsPayload.findIndex((credit) => {
        return (
          credit.vehicleClass === vehicleClass &&
          credit.zevClass === zevClass &&
          credit.modelYear === modelYear
        );
      });
      if (index > -1) {
        const credit = creditsPayload[index];
        credit.numberOfCredits = new Decimal(credit.numberOfCredits)
          .plus(new Decimal(numberOfCredits))
          .toString();
      } else {
        creditsPayload.push({
          vehicleClass,
          zevClass,
          modelYear,
          numberOfCredits,
        });
      }
    },
    [],
  );

  useEffect(() => {
    try {
      const creditsPayload: CreditsPayload = [];
      const vins: string[] = [];
      const workbook = props.workbook;
      const sheets = [
        workbook.getWorksheet(GovTemplateSheetNames.ValidVins),
        workbook.getWorksheet(GovTemplateSheetNames.CurableVins),
      ];
      sheets.forEach((sheet) => {
        if (sheet) {
          const sheetName = sheet.name;
          const headersRow = sheet.getRow(SheetStructure.HeaderIndex);
          const headersMap = getHeadersToColsMap(headersRow);
          const vinCol = headersMap[GovTemplateCurableVinsHeaderNames.VIN];
          const vehicleClassCol =
            headersMap[GovTemplateCurableVinsHeaderNames.VehicleClass];
          const zevClassCol =
            headersMap[GovTemplateCurableVinsHeaderNames.ZevClass];
          const modelYearCol =
            headersMap[GovTemplateCurableVinsHeaderNames.ModelYear];
          const numberOfCreditsCol =
            headersMap[GovTemplateCurableVinsHeaderNames.NumberOfCredits];
          const invalidReasonCol =
            headersMap[GovTemplateValidVinsHeaderNames.InvalidReason];
          const validReasonCol =
            headersMap[GovTemplateCurableVinsHeaderNames.ValidReason];
          if (
            !vinCol ||
            !vehicleClassCol ||
            !zevClassCol ||
            !modelYearCol ||
            !numberOfCreditsCol ||
            (sheetName === GovTemplateSheetNames.CurableVins &&
              !validReasonCol) ||
            (sheetName === GovTemplateSheetNames.ValidVins && !invalidReasonCol)
          ) {
            throw new Error(`Missing required header in "${sheetName}" sheet`);
          }
          sheet.eachRow((row, rowNumber) => {
            if (rowNumber > SheetStructure.HeaderIndex) {
              const vehicleClass = row
                .getCell(vehicleClassCol)
                .value?.toString();
              const vin = row.getCell(vinCol).value?.toString();
              const zevClass = row.getCell(zevClassCol).value?.toString();
              const modelYear = row.getCell(modelYearCol).value?.toString();
              const numberOfCredits = row
                .getCell(numberOfCreditsCol)
                .value?.toString();
              if (
                !vin ||
                !vehicleClass ||
                !zevClass ||
                !modelYear ||
                !numberOfCredits
              ) {
                throw new Error(
                  `Invalid row at ${rowNumber} in sheet ${sheetName}`,
                );
              }
              if (
                sheetName === GovTemplateSheetNames.ValidVins &&
                invalidReasonCol
              ) {
                const invalidReason = row.getCell(invalidReasonCol).value;
                if (!invalidReason) {
                  updateCredits(
                    creditsPayload,
                    vehicleClass,
                    zevClass,
                    modelYear,
                    numberOfCredits,
                  );
                  vins.push(vin);
                }
              } else if (
                sheetName === GovTemplateSheetNames.CurableVins &&
                validReasonCol
              ) {
                const reason = row.getCell(validReasonCol).value?.toString();
                if (reason) {
                  updateCredits(
                    creditsPayload,
                    vehicleClass,
                    zevClass,
                    modelYear,
                    numberOfCredits,
                  );
                  vins.push(vin);
                }
              }
            }
          });
        }
      });
      setCredits(creditsPayload);
      if (props.sendCreditsUpstream) {
        props.sendCreditsUpstream(creditsPayload);
      }
      if (props.sendVinsUpstream) {
        props.sendVinsUpstream(vins);
      }
    } catch (e) {
      if (e instanceof Error) {
        setCredits([]);
        setError(e.message);
      }
    }
  }, [props.workbook, updateCredits]);

  const creditsJSX = useMemo(() => {
    if (credits.length > 0) {
      const rows: JSX.Element[] = [];
      credits.forEach((credit, index) => {
        rows.push(
          <tr key={index}>
            <th key="vehicleClass">{credit.vehicleClass}</th>
            <th key="zevClass">{credit.zevClass}</th>
            <th key="modelYear">{credit.modelYear}</th>
            <th key="numberOfCredits">{credit.numberOfCredits}</th>
          </tr>,
        );
      });
      return (
        <table>
          <tbody>
            <tr key="headers">
              <th key="vehicleClass">Vehicle Class</th>
              <th key="zevClass">ZEV Class</th>
              <th key="modelYear">Model Year</th>
              <th key="numberOfCredits">Number of Units</th>
            </tr>
            {rows}
          </tbody>
        </table>
      );
    }
    return null;
  }, [credits]);

  if (error) {
    return <div>{error}</div>;
  } else if (creditsJSX) {
    return <div>{creditsJSX}</div>;
  }
  return null;
};
