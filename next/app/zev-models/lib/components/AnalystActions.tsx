"use client";

import { Button } from "@/app/lib/components";
import { VehicleStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { analystUpdate } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { CommentBox } from "@/app/lib/components/CommentBox";

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
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <CommentBox
        comment={comment}
        setComment={setComment}
        subtext="required when returning"
      />
      <div className="flex justify-between items-center pt-2">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          icon={<FontAwesomeIcon icon={faArrowLeft} />}
        >
          Back
        </Button>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => showModal("return")}>
            Return to Supplier
          </Button>
          <Button variant="primary" onClick={() => showModal("validate")}>
            Validate
          </Button>
        </div>
      </div>
      {modal}
    </>
  );
};
