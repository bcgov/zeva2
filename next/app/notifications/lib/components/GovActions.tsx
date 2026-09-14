"use client";

import { Button } from "@/app/lib/components";
import { BackButton } from "@/app/lib/components/BackButton";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { InAppNotificationStatus } from "@/prisma/generated/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faPaperPlane,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { JSX, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { deleteNotification, publishNotification } from "../actions";

export const GovActions = (props: {
  notificationId: number;
  notificationStatus: InAppNotificationStatus;
  notificationOwnerId: number;
  userId: number;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const isOwner = useMemo(() => {
    return props.notificationOwnerId === props.userId;
  }, [props.notificationOwnerId, props.userId]);

  const handleGoToEdit = useCallback(() => {
    router.push(`${Routes.Notifications}/${props.notificationId}/edit`);
  }, [props.notificationId]);

  const handleDelete = useCallback(async () => {
    setError("");
    try {
      const response = await deleteNotification(props.notificationId);
      if (response.responseType === "error") {
        throw new Error(response.message);
      }
      router.push(Routes.Notifications);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
    setModal(null);
  }, [props.notificationId]);

  const handlePublish = useCallback(async () => {
    setError("");
    try {
      const response = await publishNotification(props.notificationId);
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
  }, [props.notificationId]);

  const showModal = useCallback(
    (type: "publish" | "delete") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "publish") {
        modalType = "confirmation";
        action = handlePublish;
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
    [handlePublish, handleDelete],
  );

  return (
    <div className="flex flex-col gap-4">
      {error && <span className="text-red-600">{error}</span>}
      <div className="flex flex-row justify-between p-5 bg-lightGrey">
        <div className="flex flex-row gap-4">
          <BackButton />
          {isOwner &&
            props.notificationStatus === InAppNotificationStatus.DRAFT && (
              <Button
                variant="danger"
                icon={<FontAwesomeIcon icon={faTrash} />}
                iconPosition="right"
                onClick={() => showModal("delete")}
              >
                Delete
              </Button>
            )}
          {isOwner &&
            props.notificationStatus === InAppNotificationStatus.DRAFT && (
              <Button
                variant="secondary"
                icon={<FontAwesomeIcon icon={faEdit} />}
                iconPosition="right"
                onClick={handleGoToEdit}
              >
                Edit
              </Button>
            )}
        </div>
        {isOwner &&
          props.notificationStatus === InAppNotificationStatus.DRAFT && (
            <Button
              variant="primary"
              icon={<FontAwesomeIcon icon={faPaperPlane} />}
              iconPosition="right"
              onClick={() => showModal("publish")}
            >
              Publish Notification
            </Button>
          )}
      </div>
      {modal}
    </div>
  );
};
