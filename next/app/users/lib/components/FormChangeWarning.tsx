"use client";

import { Modal } from "@/app/lib/components/Modal";
import {
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";

export const FormChangeWarning = (props: {
  showWarningModal: boolean;
  setShowWarningModal: Dispatch<SetStateAction<boolean>>;
  handleSaveAndNavigate: () => void;
  handleNavigateWithoutSaving: () => void;
  isPending: boolean;
}) => {
  // X button - just close the modal and stay on page
  const handleClose = useCallback(() => {
    props.setShowWarningModal(false);
  }, [props]);

  // "Leave without saving" button - close and navigate away
  const handleLeaveWithoutSaving = useCallback(() => {
    props.handleNavigateWithoutSaving();
  }, [props]);

  // "Save changes" button - save and navigate
  const handleSaveAndLeave = useCallback(() => {
    props.handleSaveAndNavigate();
  }, [props]);

  return (
    <Modal
      showModal={props.showWarningModal}
      cancelLabel="Leave without saving"
      confirmLabel="Save changes and exit"
      modalType="warning"
      handleCancel={handleLeaveWithoutSaving}
      handleSubmit={handleSaveAndLeave}
      title="Unsaved changes"
      content={
        <>
          <div className="text-base font-bold mb-4">
            Do you want to save your changes before exiting?
          </div>
          <div className="text-sm text-gray-600">
            You've made changes to the user's information, but haven't saved them yet. You can save now and safely exit, or leave without saving.
          </div>
        </>
      }
      disablePrimaryButton={props.isPending}
      disableSecondaryButton={props.isPending}
      handleClose={handleClose}
    />
  );
};
