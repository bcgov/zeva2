"use client";

import { JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faXmark,
  faSquareCheck,
  faCircleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

type ModalType = "confirmation" | "error" | "info" | "warning";

export type ModalProps = {
  modalType: ModalType;
  cancelLabel?: string;
  confirmLabel?: string;
  handleCancel: () => void;
  handleSubmit: () => void;
  handleClose?: () => void;
  modalClass?: string;
  showModal: boolean;
  title?: string;
  content?: string | JSX.Element;
  disablePrimaryButton: boolean;
  disableSecondaryButton: boolean;
};

const modalTypesMap: Readonly<
  Record<ModalType, { classes: string; icon: JSX.Element }>
> = {
  confirmation: {
    classes:
      "rounded-lg bg-primaryBlue px-4 py-2 text-sm font-medium text-white hover:bg-primaryBlueHover focus:outline-none focus:ring-2 focus:ring-bluePressed",
    icon: <FontAwesomeIcon icon={faSquareCheck} className="text-success" />,
  },
  error: {
    classes:
      "rounded-lg bg-primaryRed px-4 py-2 text-sm font-medium text-white hover:bg-primaryRedHover focus:outline-none focus:ring-2 focus:ring-primaryRedPressed",
    icon: (
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-error" />
    ),
  },
  info: {
    classes: "",
    icon: <FontAwesomeIcon icon={faCircleInfo} className="text-info" />,
  },
  warning: {
    classes:
      "rounded-lg bg-primaryBlue px-4 py-2 text-sm font-medium text-white hover:bg-primaryBlueHover focus:outline-none focus:ring-2 focus:ring-bluePressed",
    icon: (
      <FontAwesomeIcon icon={faCircleExclamation} className="text-warning" />
    ),
  },
};

const cancelBtnClasses =
  "inline-flex items-center rounded-lg border border-dividerDark bg-white px-4 py-2 text-sm font-medium text-secondaryText hover:bg-disabledSurface focus:outline-none focus:ring-2 focus:ring-gray-400";

export function Modal({
  modalType,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  handleCancel,
  handleSubmit,
  handleClose,
  modalClass = "",
  showModal,
  title = "Confirm",
  content = "Are you sure you want to do this action?",
  disablePrimaryButton,
  disableSecondaryButton,
}: ModalProps) {
  return (
    <>
      <div
        className={`${showModal ? "fixed" : "hidden"} inset-0 z-[1000] bg-black/50`}
        aria-hidden="true"
      />
      <div
        className={`${showModal ? "fixed" : "hidden"} inset-0 z-[1001] flex items-start justify-center p-4 sm:p-6`}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-hidden={!showModal}
      >
        <div
          className={`w-full max-w-lg rounded-2xl bg-white shadow-level-3 ring-1 ring-black/5 p-6 ${modalClass}`}
          role="document"
        >
          <div className="flex justify-between items-center">
            {modalTypesMap[modalType].icon}
            <FontAwesomeIcon
              icon={faXmark}
              className="cursor-pointer"
              onClick={handleClose || handleCancel}
            />
          </div>
          <h3 className="text-xl font-bold text-primaryText py-4">{title}</h3>
          {typeof content === 'string' ? (
            <div className="text-base font-bold">{content}</div>
          ) : (
            <div>{content}</div>
          )}
          <div className="flex items-center justify-end gap-2 px-4 py-3">
            <button
              className={cancelBtnClasses}
              id="cancel"
              onClick={handleCancel}
              type="button"
              disabled={disableSecondaryButton}
            >
              {disableSecondaryButton ? "..." : cancelLabel}
            </button>
            {modalType !== "info" && (
              <button
                className={modalTypesMap[modalType].classes}
                id="confirm"
                type="button"
                onClick={handleSubmit}
                disabled={disablePrimaryButton}
              >
                {disablePrimaryButton ? "..." : confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
