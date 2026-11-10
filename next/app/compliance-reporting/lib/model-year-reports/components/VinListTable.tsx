"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { getVinListUrl } from "../actions";
import axios from "axios";
import { parseVinList } from "../utilsClient";
import { ParsedVinListRecordWithId } from "../constants";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, ClientSideTable, StatusBanner } from "@/app/lib/components";
import { ModelYear } from "@/prisma/generated/enums";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faSquareCheck } from "@fortawesome/free-solid-svg-icons";
import { downloadBuffer } from "@/app/lib/utils/download";

export const VinListTable = (props: {
  type: "myr" | "supp";
  id: number;
  modelYear: ModelYear;
  userIsGov: boolean;
}) => {
  const [isPending, startTransition] = useTransition();
  const [vinListBuf, setVinListBuf] = useState<ArrayBuffer>();
  const [parsedVinList, setParsedVinList] = useState<
    ParsedVinListRecordWithId[]
  >([]);
  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  useEffect(() => {
    const getVinList = async () => {
      const response = await getVinListUrl(props.type, props.id);
      if (response.responseType === "data") {
        const url = response.data;
        const listResponse = await axios.get(url, {
          responseType: "arraybuffer",
        });
        const vinList = listResponse.data;
        const vinListParsed = await parseVinList(vinList);
        setVinListBuf(vinList);
        setParsedVinList(
          vinListParsed.map((record, index) => {
            return { ...record, id: index };
          }),
        );
      }
    };
    getVinList();
  }, [props.type, props.id]);

  const handleDownloadVinRecords = useCallback(() => {
    if (vinListBuf) {
      startTransition(async () => {
        const fileName = `vin-list-${modelYearsMap[props.modelYear]}.xlsx`;
        downloadBuffer(fileName, vinListBuf);
      });
    }
  }, [vinListBuf]);

  const columnHelper = createColumnHelper<ParsedVinListRecordWithId>();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor((row) => row.vin, {
        id: "vin",
        header: "VIN",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.zevClass, {
        id: "zevClass",
        header: "ZEV Class",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.make, {
        id: "make",
        header: "Make",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.modelName, {
        id: "modelName",
        header: "modelName",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.zevType, {
        id: "zevType",
        header: "ZEV Type",
        enableSorting: true,
        enableColumnFilter: true,
      }),
      columnHelper.accessor((row) => row.range, {
        id: "range",
        header: "Range",
        enableSorting: true,
        enableColumnFilter: true,
      }),
    ];
  }, [columnHelper]);

  if (parsedVinList.length === 0 && !props.userIsGov) {
    return (
      <div className="flex flex-col border border-dividerMedium rounded">
        <h2 className="flex flex-col gap-2 p-5 bg-disabledSurface">
          <span className="text-xl font-bold">
            {modelYearsMap[props.modelYear]} Model Year VIN Records
          </span>
          <StatusBanner
            title="Review the information before submitting."
            primaryText="If anything is incorrect, please return to the Report Information section, update the data, and regenerate the report."
            variant="info"
          />
        </h2>
        <div className="flex flex-col p-5">
          <StatusBanner
            title="No VIN Records Submitted."
            primaryText={null}
            secondaryText="No reportable vehicle records were included in this Model Year Report. If reportable vehicles were supplied during the reporting period, return to the Report Information page, update the VIN spreadsheet, and regenerate the report before submitting."
            variant="info"
          />
        </div>
      </div>
    );
  }
  if (props.userIsGov) {
    return (
      <div className="flex flex-col border border-dividerMedium rounded">
        <h2 className="flex flex-col gap-2 p-5 bg-disabledSurface text-xl font-bold">
          {modelYearsMap[props.modelYear]} Model Year VIN Records
        </h2>
        <div className="flex flex-col p-5 gap-5">
          <div className="flex flex-row items-center justify-between">
            <span className="flex flex-row items-center gap-3">
              <FontAwesomeIcon icon={faSquareCheck} className="text-success" />
              <span className="flex flex-row items-center gap-4">
                <span className="font-bold">Reportable ZEV VIN Records</span>
                <span>{parsedVinList.length}</span>
              </span>
            </span>
            <Button
              onClick={handleDownloadVinRecords}
              variant="secondary"
              disabled={isPending}
              icon={<FontAwesomeIcon icon={faDownload} />}
            >
              Download VIN Records
            </Button>
          </div>
          <hr className="border-overlayModal"></hr>
          <ClientSideTable<ParsedVinListRecordWithId>
            columns={columns}
            data={parsedVinList}
            enableFiltering={true}
            enableSorting={true}
            initialPageSize={10}
            hideResetButton={true}
          />
        </div>
      </div>
    );
  }
  // for supplier users
  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <h2 className="flex flex-col gap-2 p-5 bg-disabledSurface">
        <span className="text-xl font-bold">
          {modelYearsMap[props.modelYear]} Model Year VIN Records
        </span>
        <StatusBanner
          title="Review the information before submitting."
          primaryText="If anything is incorrect, please return to the Report Information section, update the data, and regenerate the report."
          variant="info"
        />
      </h2>
      <div className="flex flex-col p-5 gap-5">
        <StatusBanner
          title="All vehicle records were successfully validated."
          primaryText={null}
          secondaryText="The uploaded VIN spreadsheet has been processed and used to establish reportable vehicle counts for this Model Year Report. Review the imported VIN records and validation summary below before submitting the report."
          variant="success"
        />
        <span className="flex flex-row items-center gap-3">
          <FontAwesomeIcon icon={faSquareCheck} className="text-success" />
          <span className="flex flex-row items-center gap-4">
            <span className="font-bold">Reportable ZEV VIN Records</span>
            <span>{parsedVinList.length}</span>
          </span>
        </span>
        <hr className="border-overlayModal"></hr>
        <ClientSideTable<ParsedVinListRecordWithId>
          columns={columns}
          data={parsedVinList}
          enableFiltering={true}
          enableSorting={true}
          initialPageSize={10}
          hideResetButton={true}
        />
      </div>
    </div>
  );
};
