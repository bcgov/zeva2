"use client";

import { JSX, useState, useCallback, useMemo, useTransition } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { Button } from "./inputs";

export const Dropzone = (props: {
  handleSubmit?: (files: File[]) => Promise<void>;
  handleDrop?: (acceptedFiles: FileWithPath[]) => Promise<void>;
  maxNumberOfFiles?: number;
  allowedFileTypes?: { [key: string]: string[] };
}) => {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles(acceptedFiles);
    if (props.handleDrop) {
      props.handleDrop(acceptedFiles);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: props.maxNumberOfFiles,
    accept: props.allowedFileTypes,
    disabled: isPending,
  });

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      if (props.handleSubmit) {
        try {
          await props.handleSubmit(files);
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, [props.handleSubmit, files]);

  const removeFile = useCallback(
    (fileToRemove: FileWithPath) => {
      setFiles((prev) => {
        return prev.filter((file) => file !== fileToRemove);
      });
    },
    [setFiles],
  );

  const filesJSX = useMemo(() => {
    const result: JSX.Element[] = [];
    for (const file of files) {
      result.push(
        <li key={file.path}>
          <div className="flex flex-row">
            <p className="mr-2 truncate">{file.name}</p>
            <Button
              disabled={isPending}
              onClick={() => {
                removeFile(file);
              }}
            >
              X
            </Button>
          </div>
        </li>,
      );
    }
    return result;
  }, [files, isPending]);

  return (
    <div className="w-full">
      <div className="bg-white py-2 my-2">
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
      <div className="py-4 my-4">
        {props.handleSubmit && (
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? "..." : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
};
