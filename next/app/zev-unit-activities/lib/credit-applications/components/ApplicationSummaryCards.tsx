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
    <div className="flex flex-row gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-row items-center gap-4 rounded border border-dividerMedium p-4"
        >
          <div className={`p-2 rounded-full ${card.iconBackgroundClassName}`}>
            <FontAwesomeIcon
              icon={card.icon}
              className={`size-6 ${card.iconClassName}`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold">{card.label}</span>
            <span className="text-lg font-bold">{card.value}</span>
            <span className="text-xs text-secondaryText">
              {card.supportingText}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
