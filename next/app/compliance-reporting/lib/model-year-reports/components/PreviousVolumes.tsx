import { ModelYear } from "@/prisma/generated/enums";
import Decimal from "decimal.js";

export const PreviousVolumes = (props: {
  modelYear: ModelYear;
  volumes: { modelYear: string; volume: string }[];
}) => {
  if (props.volumes.length !== 3) {
    return null;
  }
  let salesOrSupplied = "Vehicles Supplied";
  if (props.modelYear < ModelYear.MY_2024) {
    salesOrSupplied = "Consumer Vehicle Sales";
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
  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 text-xl font-bold bg-disabledBG">
        3 Year Average {salesOrSupplied}
      </div>
      <div className="p-5 grid grid-cols-2 gap-y-3">
        <div className="font-bold">{props.volumes[0].modelYear}</div>
        <div>{props.volumes[0].volume}</div>
        <hr className="col-span-2 border-disabledBG"></hr>
        <div className="font-bold">{props.volumes[1].modelYear}</div>
        <div>{props.volumes[1].volume}</div>
        <hr className="col-span-2 border-disabledBG"></hr>
        <div className="font-bold">{props.volumes[2].modelYear}</div>
        <div>{props.volumes[2].volume}</div>
        <hr className="col-span-2 border-disabledBG"></hr>
        <div className="font-bold">3 Year Average {salesOrSupplied}</div>
        <div>{avgStr}</div>
      </div>
    </div>
  );
};
