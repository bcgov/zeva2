"use client";

import axios from "axios";
import { Dropzone } from "@/app/lib/components/Dropzone";
import { useCallback, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createIcbcFile, getPutObjectData } from "../actions";
import { Routes } from "@/app/lib/constants";
import { Button } from "@/app/lib/components";
import { FileWithPath } from "react-dropzone";
import { IcbcFileStatus } from "@/prisma/generated/client";

export const Upload = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [datestring, setDatestring] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "failed">("idle");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSubmit = useCallback(() => {
    setError("");
    setUploadStatus("uploading");
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
        
        const icbcFileId = createResponse.data.icbcFileId;
        setUploadStatus("processing");
        
        // Connect to SSE endpoint for this specific file
        const eventSource = new EventSource(`/api/icbc/events?fileId=${icbcFileId}`);
        eventSourceRef.current = eventSource;
        
        let statusCheckTimeout: NodeJS.Timeout;
        let pollCount = 0;
        const maxPolls = 30;
        
        eventSource.addEventListener("message", (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "connected") {
              console.log("Connected to SSE stream");
              return;
            }
            
            // Handle status updates
            if (data.icbcFileId === icbcFileId) {
              clearTimeout(statusCheckTimeout);
              if (data.status === IcbcFileStatus.SUCCESS) {
                setUploadStatus("success");
                eventSource.close();
                // Redirect after showing success message
                setTimeout(() => {
                  router.push(Routes.Icbc);
                }, 2000);
              } else if (data.status === IcbcFileStatus.FAILURE) {
                setUploadStatus("failed");
                setError("The ICBC data upload has failed. Please check the file and try again.");
                eventSource.close();
              }
            }
          } catch (err) {
            console.error("Error parsing SSE message:", err);
          }
        });
        
        eventSource.addEventListener("error", (err) => {
          console.error("SSE connection error:", err);
          eventSource.close();
        });
        
        const checkStatus = async () => {
          pollCount++;
          
          if (pollCount > maxPolls) {
            setUploadStatus("failed");
            setError("Upload timed out. Please try again or check the ICBC files list.");
            eventSource.close();
            return;
          }
          
          try {
            const response = await fetch(`/api/icbc/status/${icbcFileId}`);
            if (response.ok) {
              const data = await response.json();
              const status = data.status as IcbcFileStatus;
              
              if (status === IcbcFileStatus.SUCCESS) {
                setUploadStatus("success");
                eventSource.close();
                setTimeout(() => {
                  router.push(Routes.Icbc);
                }, 2000);
              } else if (status === IcbcFileStatus.FAILURE) {
                setUploadStatus("failed");
                setError("The ICBC data upload has failed. Please check the file and try again.");
                eventSource.close();
              } else if (status === IcbcFileStatus.PROCESSING) {
                statusCheckTimeout = setTimeout(checkStatus, 2000);
              }
            }
          } catch (err) {
            console.error("Error checking status:", err);
            // Retry on error, but respect max polls
            if (pollCount < maxPolls) {
              statusCheckTimeout = setTimeout(checkStatus, 2000);
            }
          }
        };
        
        // Start polling after 2 seconds as a fallback
        statusCheckTimeout = setTimeout(checkStatus, 2000);
        
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
          setUploadStatus("failed");
        }
      }
    });
  }, [files, datestring, router]);

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "uploading":
        return <p className="text-blue-600 font-semibold">Uploading file...</p>;
      case "processing":
        return <p className="text-blue-600 font-semibold">Processing ICBC data... You will be notified when complete.</p>;
      case "success":
        return <p className="text-green-600 font-semibold">✓ Upload completed successfully! Redirecting...</p>;
      case "failed":
        return null;
      default:
        return null;
    }
  };

  return (
    <div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {getStatusMessage()}
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
          disabled={isPending || uploadStatus === "processing"}
        />
      </div>
      <div className="flex items-center py-2 my-2">
        <Dropzone
          files={files}
          setFiles={setFiles}
          disabled={isPending || uploadStatus === "processing"}
          maxNumberOfFiles={1}
          allowedFileTypes={{ "text/csv": [".csv"] }}
        />
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={isPending || uploadStatus === "processing"}
        >
          {uploadStatus === "processing" ? "Processing..." : isPending ? "Uploading..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};
