import { getAttachmentsCount } from "../data";
import { VehicleAttachmentsClient } from "./VehicleAttachmentsClient";

export const VehicleAttachments = async (props: { id: number }) => {
  const attachmentsCount = await getAttachmentsCount(props.id);
  if (attachmentsCount === 0) {
    return null;
  }
  return <VehicleAttachmentsClient id={props.id} />;
};
