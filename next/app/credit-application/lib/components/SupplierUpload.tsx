"use client";
import axios from "axios";
import { useCallback, useState } from "react";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { getCreditApplicationPutData, processSupplierFile } from "../actions";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "./CommentBox";

export const SupplierUpload = () => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const handleSubmit = useCallback(
    async (files: File[]) => {
      if (files.length !== 1) {
        setError("Exactly 1 file expected!");
      }
      const file = files[0];
      const putData = await getCreditApplicationPutData();
      const objectName = putData.objectName;
      const url = putData.url;
      await axios.put(url, file);
      try {
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
    },
    [comment],
  );

  const handleDrop = useCallback(async () => {
    setError("");
  }, []);

  return (
    <>
      <Dropzone
        handleSubmit={handleSubmit}
        handleDrop={handleDrop}
        maxNumberOfFiles={1}
        allowedFileTypes={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
            ".xlsx",
          ],
        }}
      />
      {error && <p className="text-red-600">{error}</p>}
      <CommentBox comment={comment} setComment={setComment} />
    </>
  );
};
