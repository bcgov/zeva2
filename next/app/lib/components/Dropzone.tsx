"use client";

import { useCallback, Dispatch, SetStateAction } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export const Dropzone = (props: {
  files: FileWithPath[];
  setFiles: Dispatch<SetStateAction<FileWithPath[]>>;
  maxNumberOfFiles: number;
  disabled: boolean;
  allowedFileTypes?: Record<string, string[]>;
  handleDrop?: (acceptedFiles: FileWithPath[]) => void;
  handleRemove?: (file: FileWithPath) => void;
}) => {
  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      props.setFiles((prev) => {
        const oldLength = prev.length;
        const newLength = oldLength + acceptedFiles.length;
        if (newLength <= props.maxNumberOfFiles) {
          return [...prev, ...acceptedFiles];
        }
        return [...acceptedFiles.toReversed(), ...prev.toReversed()]
          .slice(0, props.maxNumberOfFiles)
          .toReversed();
      });
      if (props.handleDrop) {
        props.handleDrop(acceptedFiles);
      }
    },
    [props.setFiles, props.maxNumberOfFiles, props.handleDrop],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: props.maxNumberOfFiles,
    accept: props.allowedFileTypes,
    disabled: props.disabled,
  });

  const removeFile = useCallback(
    (fileToRemove: FileWithPath) => {
      props.setFiles((prev) => {
        return prev.filter((file) => file !== fileToRemove);
      });
      if (props.handleRemove) {
        props.handleRemove(fileToRemove);
      }
    },
    [props.handleRemove, props.setFiles],
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-2 gap-1 ${props.disabled ? "bg-gray-100" : "border border-dashed border-primaryBlue/40"}`}
      >
        <input {...getInputProps()} />
        <FontAwesomeIcon icon={faArrowUpFromBracket} />
        <span>Drag and Drop files here, or</span>
        <span
          className={
            props.disabled ? "" : "text-primaryBlue underline cursor-pointer"
          }
        >
          Browse to select a file from your device to upload
        </span>
      </div>
      {props.files.length > 0 && (
        <div className="flex flex-col gap-2 p-2 border-t border-b border-dividerMedium/40">
          <div className="flex flex-row justify-between"></div>
          {props.files.map((file, index) => {
            return (
              <div key={index} className="flex flex-row justify-between">
                <span>{file.name}</span>
                <span>{file.size} Bytes</span>
                <FontAwesomeIcon
                  icon={faTrash}
                  onClick={() => {
                    if (!props.disabled) {
                      removeFile(file);
                    }
                  }}
                  className={`text-primaryRed ${props.disabled ? "" : "cursor-pointer"}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
