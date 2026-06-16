"use client";

import { Button } from "@/app/lib/components";
import { VehicleStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState, useTransition } from "react";
import { analystUpdate } from "../actions";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const AnalystActions = (props: {
  vehicleId: number;
  status: VehicleStatus;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleUpdate = useCallback(
    async (
      newStatus:
        | typeof VehicleStatus.RETURNED_TO_SUPPLIER
        | typeof VehicleStatus.VALIDATED,
    ) => {
      setError("");
      if (newStatus === VehicleStatus.RETURNED_TO_SUPPLIER && !comment.trim()) {
        setError("Comment required!");
        setModal(null);
        return;
      }
      const response = await analystUpdate(
        props.vehicleId,
        newStatus,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        if (newStatus === VehicleStatus.VALIDATED) {
          router.push(`${Routes.ValidatedZevModels}/${props.vehicleId}`);
        } else {
          router.push(Routes.SubmittedZevModels);
        }
      }
      setModal(null);
    },
    [props.vehicleId, comment],
  );

  const showModal = useCallback(
    (type: "return" | "validate") => {
      let modalType: ModalType | undefined;
      let handleSubmit: (() => void) | undefined;
      if (type === "return") {
        modalType = "error";
        handleSubmit = () => handleUpdate(VehicleStatus.RETURNED_TO_SUPPLIER);
      } else if (type === "validate") {
        modalType = "confirmation";
        handleSubmit = () => handleUpdate(VehicleStatus.VALIDATED);
      }
      if (modalType && handleSubmit) {
        setModal(
          <Modal
            showModal={true}
            modalType={modalType}
            handleSubmit={handleSubmit}
            handleCancel={() => setModal(null)}
          />,
        );
      }
    },
    [handleUpdate],
  );

  if (props.status !== VehicleStatus.SUBMITTED) {
    return null;
  }
  return (
    <>
      {error && <p className="text-red-600">{error}</p>}
      <Textarea value={comment} onChange={setComment} placeholder="Comment" />
      <Button variant="primary" onClick={() => showModal("return")}>
        Return To Supplier
      </Button>
      <Button variant="primary" onClick={() => showModal("validate")}>
        Validate
      </Button>
      {modal}
    </>
  );
};
