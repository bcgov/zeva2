import { StatusBanner } from "@/app/lib/components";
import Decimal from "decimal.js";
import type { GovCaStatRecord } from "../constants";

export const RecommendationSummary = (props: {
  stats: GovCaStatRecord[];
}) => {
  const eligibleZevs = props.stats.reduce(
    (total, record) => total + record.validVinsCount,
    0,
  );
  const eligibleCredits = props.stats.reduce(
    (total, record) => total.plus(new Decimal(record.validCreditsSum)),
    new Decimal(0),
  );

  return (
    <StatusBanner
      variant="info"
      title=""
      primaryText={`Recommend issuance of ${eligibleCredits.toFixed(2)} ZEV credits based on ${eligibleZevs} supplied and registered.`}
    />
  );
};
