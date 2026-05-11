import { ModelYear } from "@/prisma/generated/enums";
import { ParsedMyr } from "../utils";
import Decimal from "decimal.js";

export const PreviousVolumes = (props: {
  modelYear: ModelYear;
  volumes: ParsedMyr["previousVolumes"];
}) => {
  if (props.volumes.length !== 3) {
    return null;
  }
  let salesOrSupplied = "Vehicles Supplied";
  if (props.modelYear < ModelYear.MY_2024) {
    salesOrSupplied = "Consumer Sales";
  }
  let sum = new Decimal(0);
  for (const volume of props.volumes) {
    sum = sum.plus(volume.volume);
  }
  const avg = sum.div(3);
  let avgStr;
  if (avg.isInteger()) {
    avgStr = avg.toFixed(0);
  } else {
    avgStr = avg.toFixed(2);
  }
  const cellClass = "p-2 border-b border-dividerMedium/30";
  return (
    <div className="flex flex-col border border-dividerMedium/40">
      <div className="p-2 font-lg font-semibold bg-gray-100">
        3 Year Average {salesOrSupplied}
      </div>
      <div className="grid grid-cols-2">
        <div className={cellClass}>{props.volumes[0].modelYear}</div>
        <div className={cellClass}>{props.volumes[0].volume}</div>
        <div className={cellClass}>{props.volumes[1].modelYear}</div>
        <div className={cellClass}>{props.volumes[1].volume}</div>
        <div className={cellClass}>{props.volumes[2].modelYear}</div>
        <div className={cellClass}>{props.volumes[2].volume}</div>
        <div className="p-2">3 Year Average {salesOrSupplied}</div>
        <div className="p-2">{avgStr}</div>
      </div>
    </div>
  );
};
