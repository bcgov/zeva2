"use client"

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Row } from "./layout";
import Link from "next/link";

export const SecondaryNavbar = (props: {items: {label: string, route: string}[]}) => {
    const pathname = usePathname();
    const [activeLabel, setActiveLabel] = useState<string>();

    useEffect(() => {
        for (const item of props.items) {
            if (pathname.startsWith(item.route)) {
                setActiveLabel(item.label);
                break;
            }
        }
    }, [props.items, pathname]);

    return (
        <Row className="m-2 gap-2 border-b border-gray-400">
          {props.items.map((item, index) => {
            const isActive = activeLabel === item.label;
            return (
              <Link
                key={index}
                className={
                  "px-4 py-2.5 text-sm -mb-px rounded-t" +
                  (isActive
                    ? " border-t border-l border-r border-gray-400 border-b-white bg-white text-black"
                    : " border-t border-l border-r border-gray-300 border-b-gray-400 text-[#255A90] hover:bg-[#F7F9FC]")
                }
                href={item.route}
              >
                {item.label}
              </Link>
            );
          })}
        </Row>
    )
}

