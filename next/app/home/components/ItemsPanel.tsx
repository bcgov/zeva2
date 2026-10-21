"use client";

import { JSX, useState, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faList,
  faMoneyBillTransfer,
  faCar,
  faChevronUp,
  faChevronDown,
  faArrowRight,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  supplierGetActionRequiredItems,
  supplierGetForAwarenessItems,
  supplierGetInProgressItems,
} from "../lib/actions";
import { DashboardTone, dashboardToneClasses, Item } from "../lib/constants";
import Link from "next/link";

const panelTones: Record<
  "Requires Your Action" | "In Progress" | "For Awareness",
  DashboardTone
> = {
  "Requires Your Action": "error",
  "In Progress": "warning",
  "For Awareness": "success",
};

export const ItemsPanel = (props: {
  title: "Requires Your Action" | "In Progress" | "For Awareness";
  countsMap: Record<string, number>;
  viewAllRoute: string;
}) => {
  const tone = dashboardToneClasses[panelTones[props.title]];
  const total = Object.values(props.countsMap).reduce(
    (sum, count) => sum + count,
    0,
  );
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, Item[]>>({});

  const iconsMap: Record<string, JSX.Element> = useMemo(() => {
    return {
      "Model Year Reports": <FontAwesomeIcon icon={faFile} />,
      "Credit Applications": <FontAwesomeIcon icon={faList} />,
      "ZEV Models": <FontAwesomeIcon icon={faCar} />,
      "Credit Transfers": <FontAwesomeIcon icon={faMoneyBillTransfer} />,
    };
  }, []);

  const handleOpenClose = useCallback(
    async (key: string) => {
      const foundIndex = openCategories.findIndex(
        (category) => category === key,
      );
      if (foundIndex === -1) {
        // not yet open; check itemsMap for it; if undefined, call an action
        if (!itemsMap[key]) {
          let items: Item[] = [];
          if (props.title === "Requires Your Action") {
            items = (await supplierGetActionRequiredItems(key, [])).data;
          } else if (props.title === "In Progress") {
            items = (await supplierGetInProgressItems(key, [])).data;
          } else if (props.title === "For Awareness") {
            items = (await supplierGetForAwarenessItems(key, [])).data;
          }
          setItemsMap((prev) => {
            return {
              ...prev,
              [key]: items,
            };
          });
        }
        setOpenCategories((prev) => {
          return [...prev, key];
        });
      } else {
        setOpenCategories((prev) => {
          return prev.toSpliced(foundIndex, 1);
        });
      }
    },
    [props.title, openCategories, itemsMap],
  );

  const handleLoadMore = useCallback(
    async (key: string) => {
      if (openCategories.includes(key) && itemsMap[key]) {
        const idsToExclude = itemsMap[key].map((item) => item.id);
        let moreItems: Item[] = [];
        if (props.title === "Requires Your Action") {
          moreItems = (await supplierGetActionRequiredItems(key, idsToExclude))
            .data;
        } else if (props.title === "In Progress") {
          moreItems = (await supplierGetInProgressItems(key, idsToExclude))
            .data;
        } else if (props.title === "For Awareness") {
          moreItems = (await supplierGetForAwarenessItems(key, idsToExclude))
            .data;
        }
        setItemsMap((prev) => {
          return {
            ...prev,
            [key]: [...prev[key], ...moreItems],
          };
        });
      }
    },
    [props.title, openCategories, itemsMap],
  );

  return (
    <div
      className={`flex flex-col overflow-hidden rounded border bg-lightGrey ${tone.border}`}
    >
      <div
        className={`flex flex-row items-center justify-between border-b px-4 py-4 ${tone.border} ${tone.bg}`}
      >
        <div className="flex flex-row items-center gap-4">
          <FontAwesomeIcon icon={faCircle} className={`h-6 w-6 ${tone.text}`} />
          <span className="text-lg font-bold">
            {props.title} ({total})
          </span>
        </div>
        <Link
          href={props.viewAllRoute}
          className="flex flex-row items-center gap-2 font-bold text-link underline"
        >
          View all
          <FontAwesomeIcon icon={faArrowRight} className="h-5 w-5" />
        </Link>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {Object.entries(props.countsMap).map(([key, count]) => {
          if (count === 0) {
            return null;
          }
          const isOpen = openCategories.includes(key);
          return (
            <div
              key={key}
              className="flex flex-col rounded border border-dividerMedium bg-white"
            >
              <div
                className="flex cursor-pointer flex-row items-center justify-between px-5 py-5 hover:bg-disabledSurface"
                onClick={() => handleOpenClose(key)}
              >
                <div className="flex flex-row items-center gap-4">
                  <span className="flex w-6 justify-center text-primaryIcon">
                    {iconsMap[key]}
                  </span>
                  <span>
                    <span className="font-bold text-secondaryText">{key}</span>
                    {" - "}
                    <span className="text-secondaryText">{count}</span>
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={isOpen ? faChevronUp : faChevronDown}
                  className="h-4 w-4 text-link"
                />
              </div>
              {isOpen && itemsMap[key] && (
                <div className="flex flex-col divide-y divide-dividerMedium/30 border-t border-dividerMedium/30">
                  {Object.values(itemsMap[key]).map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="flex flex-row justify-between px-5 py-3"
                      >
                        <div className="flex flex-row items-center gap-2">
                          <span className="rounded-md border px-2">
                            {item.timestamp ? item.timestamp : "Unknown"}
                          </span>
                          <span className="text-primaryIcon">
                            {iconsMap[key]}
                          </span>
                          <span className="font-bold">ID {item.id}</span>
                          <span>
                            <span className="font-bold">
                              {key.endsWith("s") ? key.slice(0, -1) : key}{" "}
                              -{" "}
                            </span>
                            {item.status}
                          </span>
                        </div>
                        <div>
                          <Link href={item.route} className="text-link">
                            {item.cta}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {itemsMap[key].length < props.countsMap[key] && (
                    <div
                      className="cursor-pointer px-5 py-3 text-link"
                      onClick={() => handleLoadMore(key)}
                    >
                      Load More
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {total === 0 && (
          <span className="text-sm text-secondaryText">No records</span>
        )}
      </div>
    </div>
  );
};
