"use client";

import { JSX, useState, useCallback, useMemo } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { Button } from "./inputs";
import { LoadingSkeleton } from "./skeletons";

export const Dropzone = (props: {
  handleSubmit?: (files: File[]) => Promise<void>;
  handleDrop?: (acceptedFiles: FileWithPath[]) => Promise<void>;
  maxNumberOfFiles?: number;
  allowedFileTypes?: { [key: string]: string[] };
}) => {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [actionPending, setActionPending] = useState<boolean>(false);
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
  });

  const handleSubmit = useCallback(async () => {
    if (props.handleSubmit) {
      setActionPending(true);
      try {
        await props.handleSubmit(files);
        setActionPending(false);
      } catch (e) {
        console.error(e);
      }
    }
  }, [props.handleSubmit, files]);

  const filesJSX = useMemo(() => {
    const result: JSX.Element[] = [];
    for (const file of files) {
      result.push(<li key={file.path}>{file.name}</li>);
    }
    return result;
  }, [files]);

  if (actionPending) {
    return <LoadingSkeleton />;
  }
  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      <ul>{filesJSX}</ul>
      {props.handleSubmit && <Button onClick={handleSubmit}>Submit</Button>}
    </div>
  );
};
