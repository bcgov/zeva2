"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export const Breadcrumbs = (props: { items: BreadcrumbItem[] }) => {
  if (props.items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="m-2">
      <ol className="flex flex-wrap items-center gap-2 text-base font-medium">
        {props.items.map((item, index) => {
          const isCurrent = index === props.items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <FontAwesomeIcon
                  aria-hidden="true"
                  className="h-4 w-4 text-primaryIcon"
                  icon={faChevronRight}
                />
              )}
              {item.href && !isCurrent ? (
                <Link className="text-link hover:underline" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className="text-primaryText"
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
