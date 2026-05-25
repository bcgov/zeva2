"use client";

import { Button } from "@/app/lib/components";
import { Role, VehicleStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useState, useTransition } from "react";
import {
  supplierActivate,
  supplierDeactivate,
  supplierDelete,
  supplierSubmit,
} from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const SupplierActions = (props: {
  vehicleId: number;
  status: VehicleStatus;
  isActive: boolean;
  userRoles: Role[];
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const handleDelete = useCallback(async () => {
    const response = await supplierDelete(props.vehicleId);
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(Routes.SubmittedZevModels);
    }
    setModal(null);
  }, [props.vehicleId]);

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.SubmittedZevModels}/${props.vehicleId}/edit`);
  }, [props.vehicleId]);

  const handleSubmit = useCallback(async () => {
    setError("");
    const response = await supplierSubmit(
      props.vehicleId,
      getNormalizedComment(comment),
    );
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.refresh();
    }
    setModal(null);
  }, [props.vehicleId, comment]);

  const handleActivateDeactivate = useCallback(
    async (type: "activate" | "deactivate") => {
      setError("");
      let response;
      if (type === "activate") {
        response = await supplierActivate(props.vehicleId);
      } else if (type === "deactivate") {
        response = await supplierDeactivate(props.vehicleId);
      } else {
        setError("Invalid Action!");
        setModal(null);
        return;
      }
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(
          `${
            type === "activate"
              ? Routes.ValidatedZevModels
              : Routes.InactiveZevModels
          }/${props.vehicleId}/details`,
        );
      }
      setModal(null);
    },
    [props.vehicleId],
  );

  const showModal = useCallback(
    (type: "delete" | "submit" | "activate" | "deactivate") => {
      let modalType: ModalType | undefined;
      let action: (() => void) | undefined;
      if (type === "delete") {
        modalType = "error";
        action = handleDelete;
      } else if (type === "submit") {
        modalType = "confirmation";
        action = handleSubmit;
      } else if (type === "activate") {
        modalType = "confirmation";
        action = () => handleActivateDeactivate("activate");
      } else if (type === "deactivate") {
        modalType = "warning";
        action = () => handleActivateDeactivate("deactivate");
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
    [handleDelete, handleSubmit, handleActivateDeactivate],
  );

  if (props.status === VehicleStatus.VALIDATED && props.isActive) {
    return (
      <>
        <Button variant="secondary" onClick={() => showModal("deactivate")}>
          Deactivate
        </Button>
        {modal}
      </>
    );
  }
  if (props.status === VehicleStatus.VALIDATED && !props.isActive) {
    return (
      <>
        <Button variant="secondary" onClick={() => showModal("activate")}>
          Activate
        </Button>
        {modal}
      </>
    );
  }
  if (
    props.status === VehicleStatus.DRAFT ||
    props.status === VehicleStatus.RETURNED_TO_SUPPLIER
  ) {
    return (
      <>
        {error && <p className="text-red-600">{error}</p>}
        <Textarea value={comment} onChange={setComment} />
        <Button variant="danger" onClick={() => showModal("delete")}>
          Delete
        </Button>
        <Button variant="secondary" onClick={handleGoToEdit}>
          Edit
        </Button>
        {props.userRoles.includes(Role.SIGNING_AUTHORITY) && (
          <Button variant="primary" onClick={() => showModal("submit")}>
            Submit
          </Button>
        )}
        {modal}
      </>
    );
  }
  return null;
};
