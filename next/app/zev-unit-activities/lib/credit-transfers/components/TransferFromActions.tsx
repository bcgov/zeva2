"use client";

import { Button } from "@/app/lib/components";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState } from "react";
import { deleteTransfer, rescindTransfer, submitTransfer } from "../actions";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { Routes } from "@/app/lib/constants";
import { Modal, ModalType } from "@/app/lib/components/Modal";

export const TransferFromActions = (props: {
  id: number;
  type: "draft" | "rescindable";
  transferFromSupplierName: string;
}) => {
  const router = useRouter();
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const [statementSigned, setStatementSigned] = useState<boolean>(false);

  const statement = useMemo(() => {
    return `On behalf of ${props.transferFromSupplierName}, I confirm that the information in this notice is accurate and complete, and that ${props.transferFromSupplierName} consents to this transfer.`;
  }, [props.transferFromSupplierName]);

  const handleRescindOrSubmit = useCallback(
    async (type: "rescind" | "submit") => {
      setError("");
      try {
        let response;
        switch (type) {
          case "rescind":
            response = await rescindTransfer(
              props.id,
              getNormalizedComment(comment),
            );
            break;
          case "submit":
            response = await submitTransfer(
              props.id,
              statement,
              getNormalizedComment(comment),
            );
            break;
        }
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
    },
    [props.id, statement, comment],
  );

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.CreditTransfers}/${props.id}/edit`);
  }, [props.id]);

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      await deleteTransfer(props.id);
      router.push(Routes.CreditTransfers);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.id]);

  const showModal = useCallback(
    (type: "rescind" | "submit" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "rescind") {
        modalType = "error";
        action = () => handleRescindOrSubmit("rescind");
      } else if (type === "submit") {
        modalType = "confirmation";
        action = () => handleRescindOrSubmit("submit");
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
    [handleRescindOrSubmit, handleDelete],
  );

  switch (props.type) {
    case "draft":
      return (
        <div className="space-y-2">
          {error && <p className="text-red-600">{error}</p>}
          <Textarea value={comment} onChange={setComment} />
          <Button variant="danger" onClick={() => showModal("delete")}>
            Delete
          </Button>
          <Button variant="secondary" onClick={handleGoToEdit}>
            Edit
          </Button>
          <div className="p-1 flex flex-row gap-1">
            <input
              type="checkbox"
              checked={statementSigned}
              onChange={() =>
                setStatementSigned((prev) => {
                  return !prev;
                })
              }
            />
            <span className="font-semibold">{statement}</span>
          </div>
          <Button
            variant="primary"
            disabled={!statementSigned}
            onClick={() => showModal("submit")}
          >
            Submit to Transfer Partner
          </Button>
          {modal}
        </div>
      );
    case "rescindable":
      return (
        <div className="space-y-2">
          {error && <p className="text-red-600">{error}</p>}
          <Textarea value={comment} onChange={setComment} />
          <Button variant="danger" onClick={() => showModal("rescind")}>
            Rescind
          </Button>
          {modal}
        </div>
      );
  }
};
