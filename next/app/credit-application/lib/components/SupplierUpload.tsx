"use client";

import axios from "axios";
import { useCallback, useState, useTransition } from "react";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { getCreditApplicationPutData, processSupplierFile } from "../actions";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "./CommentBox";
import { FileWithPath } from "react-dropzone";
import { Button } from "@/app/lib/components";

export const SupplierUpload = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [error, setError] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (files.length !== 1) {
          throw new Error("Exactly 1 file expected!");
        }
        const file = files[0];
        const putData = await getCreditApplicationPutData();
        const objectName = putData.objectName;
        const url = putData.url;
        await axios.put(url, file);
        const response = await processSupplierFile(
          objectName,
          file.name,
          comment,
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        const applicationId = response.data;
        router.push(`${Routes.CreditApplication}/${applicationId}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [files, comment, router]);

  return (
    <>
      <Dropzone
        files={files}
        setFiles={setFiles}
        disabled={isPending}
        maxNumberOfFiles={1}
        allowedFileTypes={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
            ".xlsx",
          ],
        }}
      />
      {error && <p className="text-red-600">{error}</p>}
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? "..." : "Submit"}
      </Button>
    </>
  );
};
