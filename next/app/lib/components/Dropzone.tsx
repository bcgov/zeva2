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
        <table className="mt-4 w-full table-fixed text-sm text-primaryText">
          <thead>
            <tr className="border-gray-200">
              <th className="w-1/3 py-3 text-left font-semibold">Uploaded File</th>
              <th className="w-1/3 py-3 text-center font-semibold">Size</th>
              <th className="w-1/3 py-3 text-right font-semibold">Delete</th>
            </tr>
          </thead>
          <tbody>
            {props.files.map((file) => (
              <tr key={`${file.name}-${file.size}-${file.lastModified}`}>
                <td className="py-3">{file.name}</td>
                <td className="py-3 text-center">{(file.size / 1000).toFixed(1)} KB</td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeFile(file)}
                    disabled={props.disabled}
                    className="m-0 border-none bg-transparent p-0 text-primaryRed hover:bg-transparent hover:text-primaryRedHover disabled:opacity-50"
                    aria-label={`Delete ${file.name}`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
