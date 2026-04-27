"use client";

import { JSX, useState, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faList,
  faMoneyBillTransfer,
  faCar,
  faAngleUp,
  faAngleDown,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  supplierGetActionRequiredItems,
  supplierGetForAwarenessItems,
  supplierGetInProgressItems,
} from "../lib/actions";
import { Item } from "../lib/constants";
import Link from "next/link";

export const ItemsPanel = (props: {
  title: "Requires Your Action" | "In Progress" | "For Awareness";
  countsMap: Record<string, number>;
}) => {
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
    <div className="border border border-dividerMedium/30">
      <div className="flex flex-row items-center bg-gray-50 gap-2 p-2">
        {props.title === "Requires Your Action" && (
          <FontAwesomeIcon icon={faCircle} className="text-error" />
        )}
        {props.title === "In Progress" && (
          <FontAwesomeIcon icon={faCircle} className="text-warning" />
        )}
        {props.title === "For Awareness" && (
          <FontAwesomeIcon icon={faCircle} className="text-success" />
        )}
        <span className="font-bold">{props.title}</span>
      </div>
      {Object.entries(props.countsMap).map(([key, count]) => {
        if (count === 0) {
          return null;
        }
        return (
          <div key={key} className="flex flex-col">
            <div
              className="flex flex-row justify-between cursor-pointer p-2"
              onClick={() => handleOpenClose(key)}
            >
              <div className="flex flex-row items-center gap-2">
                {iconsMap[key]}
                <span className="font-bold">{key}</span>
                <span>{count}</span>
              </div>
              <FontAwesomeIcon
                icon={openCategories.includes(key) ? faAngleUp : faAngleDown}
              />
            </div>
            {openCategories.includes(key) && itemsMap[key] && (
              <div className="flex flex-col divide-y divide-dividerMedium">
                {Object.values(itemsMap[key]).map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="flex flex-row justify-between p-2"
                    >
                      <div className="flex flex-row items-center gap-2">
                        <span className="rounded-md border px-2">
                          {item.timestamp ? item.timestamp : "Unknown"}
                        </span>
                        {iconsMap[key]}
                        <span className="font-bold">
                          {key.endsWith("s") ? key.slice(0, -1) : key}
                        </span>
                        <span>- {item.status}</span>
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
                    className="cursor-pointer"
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
    </div>
  );
};
