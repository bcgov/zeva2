import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faCoins,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { GovCaStatRecord } from "../constants";
import Decimal from "decimal.js";

type SummaryCard = {
  label: string;
  value: string;
  supportingText: string;
  icon: IconDefinition;
  iconClassName: string;
  iconBackgroundClassName: string;
};

const sumCredits = (credits: string[]) =>
  credits.reduce(
    (total, units) => total.plus(new Decimal(units)),
    new Decimal(0),
  );

const formatPercentage = (value: Decimal, total: Decimal) =>
  `${(total.eq(new Decimal(0)) ? new Decimal(0) : value.div(total).times(new Decimal(100))).toFixed(2)}% of application`;

export const ApplicationSummaryCards = (props: {
  stats: GovCaStatRecord[];
}) => {
  const submittedVins = props.stats.reduce(
    (total, record) => total + record.vinsCount,
    0,
  );
  const eligibleVins = props.stats.reduce(
    (total, record) => total + record.validVinsCount,
    0,
  );
  const creditsClaimed = sumCredits(
    props.stats.map((record) => record.creditsSum),
  );
  const creditsEligible = sumCredits(
    props.stats.map((record) => record.validCreditsSum),
  );

  const cards: SummaryCard[] = [
    {
      label: "Submitted VINs",
      value: submittedVins.toString(),
      supportingText: "100% of application",
      icon: faFileLines,
      iconClassName: "text-infoIcon",
      iconBackgroundClassName: "bg-infoBG",
    },
    {
      label: "Eligible VINs",
      value: eligibleVins.toString(),
      supportingText: formatPercentage(
        new Decimal(eligibleVins),
        new Decimal(submittedVins),
      ),
      icon: faCircleCheck,
      iconClassName: "text-successIcon",
      iconBackgroundClassName: "bg-[#F1F8F2]",
    },
    {
      label: "Not Eligible VINs",
      value: (submittedVins - eligibleVins).toString(),
      supportingText: formatPercentage(
        new Decimal(submittedVins - eligibleVins),
        new Decimal(submittedVins),
      ),
      icon: faCircleXmark,
      iconClassName: "text-errorIcon",
      iconBackgroundClassName: "bg-[#FFF3F2]",
    },
    {
      label: "Credits Claimed",
      value: creditsClaimed.toFixed(2),
      supportingText: "Total Credits",
      icon: faCoins,
      iconClassName: "text-infoIcon",
      iconBackgroundClassName: "bg-infoBG",
    },
    {
      label: "Credits Eligible",
      value: creditsEligible.toFixed(2),
      supportingText: "Total Eligible Credits",
      icon: faCoins,
      iconClassName: "text-successIcon",
      iconBackgroundClassName: "bg-[#F1F8F2]",
    },
  ];

  return (
    <section
      aria-label="Credit application summary"
      className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {cards.map((card) => (
        <article
          key={card.label}
          className="flex min-h-24 items-center gap-3 rounded border border-dividerMedium bg-white px-4 py-3"
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${card.iconBackgroundClassName}`}
          >
            <FontAwesomeIcon
              icon={card.icon}
              className={`size-4 ${card.iconClassName}`}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-5">{card.label}</h2>
            <div className="text-lg font-bold leading-6">{card.value}</div>
            <p className="text-xs leading-5 text-secondaryText">
              {card.supportingText}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
};
