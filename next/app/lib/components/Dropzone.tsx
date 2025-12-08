"use client";

import { JSX, useCallback, useMemo, Dispatch, SetStateAction } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { Button } from "./inputs";

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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

  const filesJSX = useMemo(() => {
    const result: JSX.Element[] = [];
    for (const file of props.files) {
      result.push(
        <li key={crypto.randomUUID()}>
          <div className="flex flex-row">
            <p className="mr-2 truncate">{file.name}</p>
            <Button
              variant="danger"
              size="small"
              disabled={props.disabled}
              onClick={() => {
                removeFile(file);
              }}
            >
              {props.disabled ? "..." : "X"}
            </Button>
          </div>
        </li>,
      );
    }
    return result;
  }, [props.files, props.disabled, removeFile]);

  return (
    <div className="w-full">
      <div
        className={`${props.disabled ? "bg-gray-100" : "bg-white"} py-2 my-2 rounded-lg shadow-level-1 p-4`}
      >
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag 'n' drop some files here, or click to select files</p>
          )}
        </div>
        <ul>{filesJSX}</ul>
      </div>
    </div>
  );
};
