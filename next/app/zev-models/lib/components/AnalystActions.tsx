"use client";

import { Button } from "@/app/lib/components";
import { VehicleStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import { analystUpdate } from "../actions";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

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
      <div className="border border-gray-300 rounded">
        <div className="p-4 bg-gray-100 border-b border-gray-300">
          <h2 className="text-sm font-bold text-gray-900">
            Comment (Required)
          </h2>
        </div>
        <div className="p-4">
          <Textarea
            value={comment}
            onChange={setComment}
            placeholder="Enter a description..."
          />
        </div>
      </div>
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
