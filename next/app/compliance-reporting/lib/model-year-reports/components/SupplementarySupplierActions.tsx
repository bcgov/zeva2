"use client";

import { Button } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState } from "react";
import {
  deleteSupplementary,
  submitSupplementaryToGovernment,
} from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Routes } from "@/app/lib/constants";
import { ModelYearReportStatus } from "@/prisma/generated/enums";
import { Modal, ModalType } from "@/app/lib/components/Modal";

// if myrId is defined, then we're working with a non-legacy supplementary;
// otherwise, it is a legacy supplementary
export const SupplementarySupplierActions = (props: {
  suppId: number;
  status: ModelYearReportStatus;
  myrId?: number;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      const response = await deleteSupplementary(props.suppId);
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      if (props.myrId) {
        router.push(`${Routes.ModelYearReports}/${props.myrId}`);
      } else {
        router.push(`${Routes.LegacySupplementary}`);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    try {
      const response = await submitSupplementaryToGovernment(
        props.suppId,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.refresh();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.suppId, comment]);

  const handleGoToEdit = useCallback(() => {
    if (props.myrId) {
      router.push(
        `${Routes.ModelYearReports}/${props.myrId}/supplementary/${props.suppId}/edit`,
      );
    } else {
      router.push(`${Routes.LegacySupplementary}/${props.suppId}/edit`);
    }
  }, [props.myrId, props.suppId]);

  const showModal = useCallback(
    (type: "submit" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmit;
      } else if (type === "delete") {
        modalType = "error";
        action = handleDelete;
      }
      if (modalType && action) {
        setModal(
          <Modal
            showModal={true}
            modalType={modalType}
            handleSubmit={action}
            handleCancel={() => setModal(null)}
          />,
        );
      }
    },
    [handleSubmit, handleDelete],
  );

  if (
    props.status === ModelYearReportStatus.DRAFT ||
    props.status === ModelYearReportStatus.RETURNED_TO_SUPPLIER
  ) {
    return (
      <div className="space-y-2">
        {error && <p className="text-red-600">{error}</p>}
        <Textarea value={comment} onChange={setComment} />
        <Button variant="secondary" onClick={() => showModal("delete")}>
          Delete
        </Button>
        <Button variant="secondary" onClick={handleGoToEdit}>
          Edit
        </Button>
        <Button variant="primary" onClick={() => showModal("submit")}>
          Submit
        </Button>
        {modal}
      </div>
    );
  }
  return null;
};
