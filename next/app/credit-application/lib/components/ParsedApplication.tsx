"use client";
import Excel from "exceljs";
import { useState, useEffect, useCallback, useMemo, JSX } from "react";
import { getHeadersMap } from "../utils";
import { Decimal } from "@prisma/client/runtime/library";

export const ParsedApplication = (props: {
  workbook: Excel.Workbook;
  actions: (
    | "Submit to Director"
    | "Issue Credits"
    | "Reject"
    | "Return to Analyst"
    | "Return to Supplier"
  )[];
}) => {
  type CreditsPayload = Record<
    "vehicleClass" | "zevClass" | "modelYear" | "numberOfCredits",
    string
  >[];
  const [credits, setCredits] = useState<CreditsPayload>([]);
  const [error, setError] = useState<string>("");

  const updateCredits = useCallback(
    (
      vehicleClass: string,
      zevClass: string,
      modelYear: string,
      numberOfCredits: string,
    ) => {
      setCredits((prev) => {
        const index = prev.findIndex((credit) => {
          return (
            credit.vehicleClass === vehicleClass &&
            credit.zevClass === zevClass &&
            credit.modelYear === modelYear
          );
        });
        if (index > -1) {
          const credit = prev[index];
          const newCredit = {
            ...credit,
            numberOfCredits: new Decimal(credit.numberOfCredits)
              .plus(new Decimal(numberOfCredits))
              .toString(),
          };
          return [...prev.toSpliced(index, 1), newCredit];
        }
        return [
          ...prev,
          {
            vehicleClass,
            zevClass,
            modelYear,
            numberOfCredits,
          },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    try {
      const workbook = props.workbook;
      const sheets = [
        workbook.getWorksheet("Valid"),
        workbook.getWorksheet("Invalid"),
      ];
      sheets.forEach((sheet) => {
        if (sheet) {
          const sheetName = sheet.name;
          const headersRow = sheet.getRow(1);
          const headersMap = getHeadersMap(headersRow, false);
          const vehicleClassCol = headersMap["vehicleClass"];
          const zevClassCol = headersMap["zevClass"];
          const modelYearCol = headersMap["modelYear"];
          const numberOfCreditsCol = headersMap["numberOfCredits"];
          const reasonCol = headersMap["reason"];
          if (
            !vehicleClassCol ||
            !zevClassCol ||
            !modelYearCol ||
            !numberOfCreditsCol ||
            (sheetName === "Invalid" && !reasonCol)
          ) {
            throw new Error(`Missing required header in "${sheetName}" sheet`);
          }
          sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
              const vehicleClass = row
                .getCell(vehicleClassCol)
                .value?.toString();
              const zevClass = row.getCell(zevClassCol).value?.toString();
              const modelYear = row.getCell(modelYearCol).value?.toString();
              const numberOfCredits = row
                .getCell(numberOfCreditsCol)
                .value?.toString();
              if (
                !vehicleClass ||
                !zevClass ||
                !modelYear ||
                !numberOfCredits
              ) {
                throw new Error(
                  `Invalid row at ${rowNumber} in sheet ${sheetName}`,
                );
              }
              if (sheetName === "Valid") {
                updateCredits(
                  vehicleClass,
                  zevClass,
                  modelYear,
                  numberOfCredits,
                );
              } else if (sheetName === "Invalid" && reasonCol) {
                const reason = row.getCell(reasonCol).value?.toString();
                if (reason) {
                  updateCredits(
                    vehicleClass,
                    zevClass,
                    modelYear,
                    numberOfCredits,
                  );
                }
              }
            }
          });
        }
      });
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
          <tr key="headers">
            <th key="vehicleClass">Vehicle Class</th>
            <th key="zevClass">ZEV Class</th>
            <th key="modelYear">Model Year</th>
            <th key="numberOfCredits">Number of Units</th>
          </tr>
          {rows}
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
