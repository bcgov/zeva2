"use client";
import axios from "axios";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { useCallback, useState } from "react";

export const Upload = (props: {
  getPutData: () => Promise<{ objectName: string; url: string } | undefined>;
  createFile: (filename: string, datestring: string) => Promise<void>;
}) => {
  const [datestring, setDatestring] = useState<string>("");
  const handleSubmit = useCallback(
    async (files: File[]) => {
      if (files.length === 1) {
        const file = files[0];
        const putData = await props.getPutData();
        if (putData) {
          const objectName = putData.objectName;
          const url = putData.url;
          await axios.put(url, file);
          await props.createFile(objectName, datestring);
        }
      }
    },
    [props, datestring],
  );
  return (
    <div>
      <input
        className="border-2 border-solid"
        placeholder="YYYY-MM-DD"
        value={datestring}
        onChange={(event) => {
          setDatestring(event.target.value);
        }}
      />
      <Dropzone
        handleSubmit={handleSubmit}
        maxNumberOfFiles={1}
        allowedFileTypes={{ "text/csv": [".csv"] }}
      />
    </div>
  );
};
