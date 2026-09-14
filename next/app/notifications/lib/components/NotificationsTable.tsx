"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Button, ClientSideTable } from "@/app/lib/components";
import { SerializedNotificationSparse } from "../constants";
import {
  getNotificationStatusEnumsToStringsMap,
  getNotificationTypeEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

export const NotificationsTable = (props: {
  notifications: SerializedNotificationSparse[];
  canCreateNotification: boolean;
}) => {
  const router = useRouter();
  const navigationAction = useCallback(async (id: number) => {
    router.push(`${Routes.Notifications}/${id}`);
  }, []);
  const columnHelper = createColumnHelper<SerializedNotificationSparse>();
  const statusMap = useMemo(() => {
    return getNotificationStatusEnumsToStringsMap();
  }, []);
  const typeMap = useMemo(() => {
    return getNotificationTypeEnumsToStringsMap();
  }, []);
  const columns = useMemo(() => {
    const result: ColumnDef<SerializedNotificationSparse, any>[] = [
      columnHelper.accessor((row) => row.id.toString(), {
        id: "id",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>ID</span>,
      }),
      columnHelper.accessor((row) => row.owner, {
        id: "owner",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Notification Owner</span>,
      }),
      columnHelper.accessor((row) => statusMap[row.status], {
        id: "status",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Notification Status</span>,
      }),
      columnHelper.accessor((row) => typeMap[row.type], {
        id: "type",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Type</span>,
      }),
      columnHelper.accessor(
        (row) => (row.allSuppliers ? "All Suppliers" : row.audience.join(", ")),
        {
          id: "audience",
          enableSorting: true,
          enableColumnFilter: true,
          header: () => <span>Audience</span>,
        },
      ),
      columnHelper.accessor((row) => row.startDate, {
        id: "startDate",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>Start Date</span>,
      }),
      columnHelper.accessor((row) => row.endDate, {
        id: "endDate",
        enableSorting: true,
        enableColumnFilter: true,
        header: () => <span>End Date</span>,
      }),
    ];
    return result;
  }, [columnHelper, statusMap, typeMap]);

  return (
    <ClientSideTable<SerializedNotificationSparse>
      columns={columns}
      data={props.notifications}
      navigationAction={navigationAction}
      stackHeaderContents={true}
      enableFiltering={true}
      enableSorting={true}
      enableGlobalSearch={true}
      headerContent={
        props.canCreateNotification ? (
          <Button
            variant="primary"
            onClick={() => router.push(`${Routes.Notifications}/new`)}
          >
            <div className="flex flex-row items-center gap-2">
              <FontAwesomeIcon icon={faPlus} />
              <span>Create Notification</span>
            </div>
          </Button>
        ) : undefined
      }
    />
  );
};
