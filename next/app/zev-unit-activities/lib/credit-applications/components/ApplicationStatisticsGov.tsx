"use client";

import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ClientSideTable } from "@/app/lib/components";
import { GovCaStatRecord } from "../constants";
import { useEffect, useMemo, useState } from "react";
import {
  getModelYearEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import Decimal from "decimal.js";

export const ApplicationStatisticsGov = (props: {
  stats: GovCaStatRecord[];
  validated: boolean;
}) => {
  const [vinsCountTotal, setVinsCountTotal] = useState<number>();
  const [validVinsCountTotal, setValidVinsCountTotal] = useState<number>();
  const [creditsSumTotal, setCreditsSumTotal] = useState<string>();
  const [validCreditsSumTotal, setValidCreditsSumTotal] = useState<string>();

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);
  const zevClassMap = useMemo(() => {
    return getZevClassEnumsToStringsMap();
  }, []);
  const totalsTableheaderClasses = useMemo(() => {
    return "px-4 py-3 border-b border-dividerMedium font-bold text-sm";
  }, []);
  const totalsTableContentClasses = useMemo(() => {
    return "px-4 py-3 text-sm bg-infoBG";
  }, []);

  useEffect(() => {
    let vinsCountToSet = 0;
    let validVinsCountToSet = 0;
    let creditsSumToSet = new Decimal(0);
    let validCreditsSumToSet = new Decimal(0);
    for (const record of props.stats) {
      vinsCountToSet = vinsCountToSet + record.vinsCount;
      validVinsCountToSet = validVinsCountToSet + record.validVinsCount;
      creditsSumToSet = creditsSumToSet.plus(new Decimal(record.creditsSum));
      validCreditsSumToSet = validCreditsSumToSet.plus(
        new Decimal(record.validCreditsSum),
      );
    }
    setVinsCountTotal(vinsCountToSet);
    setValidVinsCountTotal(validVinsCountToSet);
    setCreditsSumTotal(creditsSumToSet.toFixed(2));
    setValidCreditsSumTotal(validCreditsSumToSet.toFixed(2));
  }, [props.stats]);

  const columnHelper = createColumnHelper<GovCaStatRecord>();
  const columns = useMemo<ColumnDef<GovCaStatRecord, any>[]>(() => {
    return [
      columnHelper.accessor((row) => row.make, {
        id: "make",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Make</span>,
      }),
      columnHelper.accessor((row) => row.modelName, {
        id: "modelName",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Name</span>,
      }),
      columnHelper.accessor((row) => modelYearsMap[row.modelYear], {
        id: "modelYear",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Model Year</span>,
      }),
      columnHelper.accessor((row) => zevClassMap[row.zevClass], {
        id: "zevClass",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ZEV Class</span>,
      }),
      columnHelper.accessor((row) => row.zevType, {
        id: "zevType",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ZEV Type</span>,
      }),
      columnHelper.accessor((row) => row.range.toString(), {
        id: "range",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Range</span>,
      }),
      columnHelper.accessor((row) => row.vinsCount.toString(), {
        id: "vinsCount",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>VINs Submitted</span>,
      }),
      ...(props.validated
        ? [
            columnHelper.accessor((row) => row.validVinsCount.toString(), {
              id: "validVinsCount",
              enableSorting: true,
              enableColumnFilter: true,
              header: () => <span>Eligible VINs</span>,
            }),
          ]
        : []),
      columnHelper.accessor((row) => row.creditsSum, {
        id: "creditsSum",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Credits Requested</span>,
      }),
      ...(props.validated
        ? [
            columnHelper.accessor((row) => row.validCreditsSum, {
              id: "validCreditsSum",
              enableSorting: true,
              enableColumnFilter: true,
              header: () => <span>Eligible Credits</span>,
            }),
          ]
        : []),
    ];
  }, [props.validated, modelYearsMap, zevClassMap]);

  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 font-bold text-xl bg-disabledBG border-b border-dividerMedium">
        ZEVs ({vinsCountTotal})
      </div>
      <div className="flex flex-col gap-4 p-5">
        <ClientSideTable<GovCaStatRecord>
          columns={columns}
          data={props.stats}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
        />
        <div className="flex flex-col border border-dividerMedium rounded">
          <div className="px-5 py-4 font-bold border-b border-dividerMedium bg-disabledBG">
            Totals
          </div>
          {props.validated ? (
            <div className="grid grid-cols-5">
              <div className={totalsTableheaderClasses}></div>
              <div className={totalsTableheaderClasses}>VINs Submitted</div>
              <div className={totalsTableheaderClasses}>Eligible VINs</div>
              <div className={totalsTableheaderClasses}>Credits Requested</div>
              <div className={totalsTableheaderClasses}>Eligible Credits</div>
              <div className={`${totalsTableContentClasses} font-bold`}>
                Total
              </div>
              <div className={totalsTableContentClasses}>{vinsCountTotal}</div>
              <div className={totalsTableContentClasses}>
                {validVinsCountTotal}
              </div>
              <div className={totalsTableContentClasses}>{creditsSumTotal}</div>
              <div className={totalsTableContentClasses}>
                {validCreditsSumTotal}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3">
              <div className={totalsTableheaderClasses}></div>
              <div className={totalsTableheaderClasses}>VINs Submitted</div>
              <div className={totalsTableheaderClasses}>Credits Requested</div>
              <div className={`${totalsTableContentClasses} font-bold`}>
                Total
              </div>
              <div className={totalsTableContentClasses}>{vinsCountTotal}</div>
              <div className={totalsTableContentClasses}>{creditsSumTotal}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
