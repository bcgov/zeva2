"use client";

import { Button } from "@/app/lib/components";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Routes } from "@/app/lib/constants";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { CreditTransferLine, CreditTransferLines } from "./CreditTransferLines";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { submitTransfer } from "../actions";
import { getCreditTransferPayload } from "../utilsClient";

export const CreditTransferForm = (props: {
  transferCandidatesMap: Record<number, string>;
  currentYear: ModelYear;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [transferTo, setTransferTo] = useState<string>("");
  const [lines, setLines] = useState<CreditTransferLine[]>([]);

  const handleTransferToSelect = useCallback((transferToId: string) => {
    setTransferTo(transferToId);
  }, []);

  const handleAddLine = useCallback(() => {
    setLines((prev) => {
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          vehicleClass: VehicleClass.REPORTABLE,
          zevClass: ZevClass.A,
          modelYear: props.currentYear,
          numberOfUnits: "0",
          dollarValuePerUnit: "0",
        },
      ];
    });
  }, [props.currentYear]);

  const handleRemoveLine = useCallback((id: string) => {
    setLines((prev) => {
      return prev.filter((line) => line.id !== id);
    });
  }, []);

  const handleLineChange = useCallback(
    (id: string, key: string, value: string) => {
      setLines((prev) => {
        return prev.map((line) => {
          if (line.id === id) {
            return { ...line, [key]: value };
          }
          return line;
        });
      });
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const payload = getCreditTransferPayload(transferTo, lines);
        const response = await submitTransfer(
          payload,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(`${Routes.CreditTransfers}/${response.data}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [transferTo, lines, comment]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex items-center py-2 my-2">
        <label htmlFor="transferToOrg" className="w-72">
          Transfer To:
        </label>
        <select
          id="transferToOrg"
          value={transferTo}
          className="border p-2 w-full"
          onChange={(e) => {
            handleTransferToSelect(e.target.value);
          }}
          disabled={isPending}
        >
          <option value="">--</option>
          {Object.entries(props.transferCandidatesMap).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <CreditTransferLines
        lines={lines}
        addLine={handleAddLine}
        removeLine={handleRemoveLine}
        handleLineChange={handleLineChange}
        disabled={isPending}
      />
      <CommentBox
        comment={comment}
        setComment={setComment}
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "..." : "Submit to Transfer Partner"}
        </Button>
      </div>
    </div>
  );
};
