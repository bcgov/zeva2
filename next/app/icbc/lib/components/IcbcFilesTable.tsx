"use client";

import { Table } from "@/app/lib/components";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo, useEffect, useRef } from "react";
import { IcbcFileSparseSerialized } from "../utils";
import { lowerCaseAndCapitalize } from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";

export const IcbcFilesTable = (props: {
  files: IcbcFileSparseSerialized[];
  totalNumberOfFiles: number;
}) => {
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Check if there are any files currently processing
  const hasProcessingFiles = useMemo(() => {
    return props.files.some((file) => file.status === "PROCESSING");
  }, [props.files]);

  // Connect to SSE when there are processing files
  useEffect(() => {
    if (hasProcessingFiles) {
      // Connect to SSE for all ICBC status updates
      const eventSource = new EventSource("/api/icbc/events");
      eventSourceRef.current = eventSource;
      
      eventSource.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "connected") {
            console.log("Connected to ICBC SSE stream");
            return;
          }
          
          // When any file status changes, refresh the page
          if (data.icbcFileId) {
            router.refresh();
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      });
      
      eventSource.addEventListener("error", (err) => {
        console.error("SSE connection error:", err);
        eventSource.close();
      });
      
      return () => {
        eventSource.close();
      };
    }
  }, [hasProcessingFiles, router]);

  const columnHelper = createColumnHelper<IcbcFileSparseSerialized>();
  const columns = useMemo(() => {
    const result: ColumnDef<IcbcFileSparseSerialized, any>[] = [
      columnHelper.accessor((row) => row.id, {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.timestamp, {
        id: "timestamp",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Upload Date</span>,
      }),
      columnHelper.accessor((row) => lowerCaseAndCapitalize(row.status), {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Status</span>,
        cell: (info) => {
          const status = info.row.original.status;
          const statusClass =
            status === "SUCCESS"
              ? "text-green-700 font-semibold"
              : status === "FAILURE"
                ? "text-red-700 font-semibold"
                : status === "PROCESSING"
                  ? "text-blue-700 font-semibold"
                  : "";
          return <span className={statusClass}>{info.getValue()}</span>;
        },
      }),
      columnHelper.accessor((row) => (row.isLegacy ? "Yes" : "No"), {
        id: "isLegacy",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Is Legacy</span>,
      }),
      columnHelper.accessor((row) => row.numberOfRecordsPreProcessing ?? "-", {
        id: "numberOfRecordsPreProcessing",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Number of ICBC Records Pre-Processing</span>,
      }),
      columnHelper.accessor((row) => row.numberOfRecordsPostProcessing ?? "-", {
        id: "numberOfRecordsPostProcessing",
        enableSorting: false,
        enableColumnFilter: false,
        header: () => <span>Number of ICBC Records Post-Processing</span>,
      }),
    ];
    return result;
  }, [columnHelper, props.files]);
  
  return (
    <div>
      {hasProcessingFiles && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-sm">
            ⏳ Files are currently being processed. You will be notified automatically when complete.
          </p>
        </div>
      )}
      <Table<IcbcFileSparseSerialized>
        columns={columns}
        data={props.files}
        totalNumberOfRecords={props.totalNumberOfFiles}
      />
    </div>
  );
};
