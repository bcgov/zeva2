import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faCoins,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { getApplicationStatistics } from "../data";

type SummaryCard = {
  label: string;
  value: string;
  supportingText: string;
  icon: IconDefinition;
  iconClassName: string;
  iconBackgroundClassName: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: 2,
  }).format(value);

const sumCredits = (
  records: {
    _sum: {
      numberOfUnits: { toString(): string } | null;
    };
  }[],
) =>
  records.reduce(
    (total, record) => total + Number(record._sum.numberOfUnits ?? 0),
    0,
  );

const formatPercentage = (value: number, total: number) =>
  `${formatNumber(total === 0 ? 0 : (value / total) * 100)}% of application`;

export const ApplicationSummaryCards = async (props: {
  creditApplicationId: number;
  eligibleVinsCount: number | null;
  ineligibleVinsCount: number | null;
  aCredits: { toString(): string } | null;
  bCredits: { toString(): string } | null;
}) => {
  const stats = await getApplicationStatistics(props.creditApplicationId);
  if (!stats) {
    return null;
  }

  const submittedVins = stats.recordStats.reduce(
    (total, record) => total + record._count.id,
    0,
  );
  const creditsClaimed = sumCredits(stats.creditStats);
  const creditsEligible =
    props.aCredits === null || props.bCredits === null
      ? null
      : Number(props.aCredits) + Number(props.bCredits);

  const cards: SummaryCard[] = [
    {
      label: "Submitted VINs",
      value: formatNumber(submittedVins),
      supportingText: "100% of application",
      icon: faFileLines,
      iconClassName: "text-infoIcon",
      iconBackgroundClassName: "bg-infoBG",
    },
    {
      label: "Eligible VINs",
      value:
        props.eligibleVinsCount === null
          ? "--"
          : formatNumber(props.eligibleVinsCount),
      supportingText:
        props.eligibleVinsCount === null
          ? "Not yet validated"
          : formatPercentage(props.eligibleVinsCount, submittedVins),
      icon: faCircleCheck,
      iconClassName: "text-successIcon",
      iconBackgroundClassName: "bg-[#F1F8F2]",
    },
    {
      label: "Not Eligible VINs",
      value:
        props.ineligibleVinsCount === null
          ? "--"
          : formatNumber(props.ineligibleVinsCount),
      supportingText:
        props.ineligibleVinsCount === null
          ? "Not yet validated"
          : formatPercentage(props.ineligibleVinsCount, submittedVins),
      icon: faCircleXmark,
      iconClassName: "text-errorIcon",
      iconBackgroundClassName: "bg-[#FFF3F2]",
    },
    {
      label: "Credits Claimed",
      value: formatNumber(creditsClaimed),
      supportingText: "Total Credits",
      icon: faCoins,
      iconClassName: "text-infoIcon",
      iconBackgroundClassName: "bg-infoBG",
    },
    {
      label: "Credits Eligible",
      value: creditsEligible === null ? "--" : formatNumber(creditsEligible),
      supportingText:
        creditsEligible === null
          ? "Not yet validated"
          : "Total Eligible Credits",
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
