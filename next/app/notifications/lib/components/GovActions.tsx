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
import {
  cancelNotification,
  deleteNotification,
  publishNotification,
} from "../actions";

export const GovActions = (props: {
  notificationId: number;
  notificationStatus: InAppNotificationStatus;
  notificationOwnerId: number;
  userId: number;
  audience: string;
  endDate: string;
}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);
  const isOwner = useMemo(() => {
    return props.notificationOwnerId === props.userId;
  }, [props.notificationOwnerId, props.userId]);

  const canCancel = useMemo(() => {
    if (
      isOwner &&
      (props.notificationStatus === InAppNotificationStatus.ACTIVE ||
        props.notificationStatus === InAppNotificationStatus.SCHEDULED)
    ) {
      return true;
    }
    return false;
  }, [isOwner, props.notificationStatus]);

  const canEditAndPublish = useMemo(() => {
    if (
      isOwner &&
      (props.notificationStatus === InAppNotificationStatus.CANCELLED ||
        props.notificationStatus === InAppNotificationStatus.DRAFT)
    ) {
      return true;
    }
    return false;
  }, [isOwner, props.notificationStatus]);

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

  const handleCancelNotification = useCallback(async () => {
    setError("");
    try {
      const response = await cancelNotification(props.notificationId);
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
  }, [props.notificationId, router]);

  const showModal = useCallback(
    (type: "publish" | "delete" | "cancel") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "publish") {
        modalType = "confirmation";
        action = handlePublish;
      } else if (type === "delete") {
        modalType = "error";
        action = handleDelete;
      } else if (type === "cancel") {
        setModal(
          <Modal
            showModal={true}
            modalType="warning"
            title="Cancel Notification?"
            content={`You are about to cancel a notification that is being displayed or scheduled to be displayed to ${props.audience} until ${props.endDate}. Once cancelled, the notification will no longer be visible to users after the page is refreshed. Are you sure you want to cancel this notification?`}
            confirmLabel="Confirm Cancellation"
            handleSubmit={handleCancelNotification}
            handleCancel={() => setModal(null)}
          />,
        );
        return;
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
    [
      handlePublish,
      handleDelete,
      handleCancelNotification,
      props.audience,
      props.endDate,
    ],
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
        </div>
        <div className="flex flex-row gap-4">
          {canEditAndPublish && (
            <Button
              variant="secondary"
              icon={<FontAwesomeIcon icon={faEdit} />}
              iconPosition="right"
              onClick={handleGoToEdit}
            >
              Edit Notification
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              icon={<FontAwesomeIcon icon={faTrash} />}
              iconPosition="right"
              onClick={() => showModal("cancel")}
            >
              Cancel Notification
            </Button>
          )}
          {canEditAndPublish && (
            <Button
              variant="primary"
              icon={<FontAwesomeIcon icon={faPaperPlane} />}
              iconPosition="right"
              onClick={() => showModal("publish")}
            >
              {props.notificationStatus === InAppNotificationStatus.CANCELLED
                ? "Republish"
                : "Publish Notification"}
            </Button>
          )}
        </div>
      </div>
      {modal}
    </div>
  );
};
