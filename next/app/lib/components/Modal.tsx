'use client';

import React from 'react';

export type ModalProps = {
  cancelLabel?: string;
  confirmClass?: string;
  confirmLabel?: string;
  handleCancel: () => void;
  handleSubmit: () => void;
  modalClass?: string;
  showModal: boolean;
  title?: string;
  icon?: React.ReactNode;
  content?: string;
};

function mapBtnClasses(variant?: string) {
  switch (variant) {
    case 'btn-primary':
      return 'inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
    case 'btn-outline-primary':
      return 'inline-flex items-center rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500';
    case 'btn-danger':
      return 'inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500';
    case 'btn-outline-secondary':
    case 'btn-secondary':
      return 'inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400';
    default:
      return variant || 'inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
  }
}

const cancelBtnClasses =
  'inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400';

export default function Modal({
  cancelLabel = 'Cancel',
  confirmClass = 'btn-outline-primary',
  confirmLabel = 'Confirm',
  handleCancel,
  handleSubmit,
  modalClass = '',
  showModal,
  title = 'Confirm',
  content = 'Are you sure you want to do this action?',
  icon = null
}: ModalProps) {
  const confirmBtnClasses = mapBtnClasses(confirmClass);

  return (
    <>
      <div
        className={`${showModal ? 'fixed' : 'hidden'} inset-0 z-[1000] bg-black/50`}
        aria-hidden="true"
      />

      <div
        className={`${showModal ? 'fixed' : 'hidden'} inset-0 z-[1001] flex items-start justify-center p-4 sm:p-6`}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-hidden={!showModal}
      >
        <div
          className={`w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5 ${modalClass}`}
          role="document"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleCancel}
              type="button"
            >
              <span aria-hidden="true" className="text-xl leading-none">&times;</span>
            </button>
          </div>

          <div className="">
            {content}
          </div>

          <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
            <button
              className={cancelBtnClasses}
              id="cancel"
              onClick={handleCancel}
              type="button"
            >
              {cancelLabel}
            </button>

            <button
              className={confirmBtnClasses}
              id="confirm"
              type="button"
              onClick={handleSubmit}
            >
              {icon}
              {icon ? <span className="ml-2">{confirmLabel}</span> : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
