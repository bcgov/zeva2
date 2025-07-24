"use client";

import axios from "axios";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIcbcFile, getPutObjectData } from "../actions";
import { Routes } from "@/app/lib/constants";
import { Button } from "@/app/lib/components";
import { FileWithPath } from "react-dropzone";

export const Upload = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [datestring, setDatestring] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        if (files.length !== 1) {
          throw new Error("Exactly 1 file expected!");
        }
        const file = files[0];
        const getPutResponse = await getPutObjectData();
        if (getPutResponse.responseType === "error") {
          throw new Error(getPutResponse.message);
        }
        const objectName = getPutResponse.data.objectName;
        const url = getPutResponse.data.url;
        await axios.put(url, file);
        const createResponse = await createIcbcFile(objectName, datestring);
        if (createResponse.responseType === "error") {
          throw new Error(createResponse.message);
        }
        router.push(Routes.Icbc);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [files, datestring, router]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex items-center py-2 my-2">
        <label htmlFor="date" className="w-72">
          Date
        </label>
        <input
          name="date"
          type="text"
          placeholder="YYYY-MM-DD"
          onChange={(e) => {
            setDatestring(e.target.value);
          }}
          value={datestring}
          className="border p-2 w-full"
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <Dropzone
          files={files}
          setFiles={setFiles}
          disabled={isPending}
          maxNumberOfFiles={1}
          allowedFileTypes={{ "text/csv": [".csv"] }}
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
