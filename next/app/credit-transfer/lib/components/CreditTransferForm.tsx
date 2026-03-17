"use client";

import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Routes } from "@/app/lib/constants";
import { CreditTransferLine, CreditTransferLines } from "./CreditTransferLines";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { saveTransfer } from "../actions";
import { getCreditTransferPayload } from "../utilsClient";

export const CreditTransferForm = (props: {
  transferCandidatesMap: Record<number, string>;
  creditTransfer?: {
    id: number;
    transferTo: number;
    lines: CreditTransferLine[];
  };
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [transferTo, setTransferTo] = useState<string>("");
  const [lines, setLines] = useState<CreditTransferLine[]>([]);

  useEffect(() => {
    if (props.creditTransfer) {
      setTransferTo(props.creditTransfer.transferTo.toString());
      setLines(props.creditTransfer.lines);
    }
  }, []);

  const handleTransferToSelect = useCallback((transferToId: string) => {
    setTransferTo(transferToId);
  }, []);

  const handleAddLine = useCallback(() => {
    setLines((prev) => {
      return [
        ...prev,
        {
          vehicleClass: VehicleClass.REPORTABLE,
          zevClass: ZevClass.A,
          modelYear: ModelYear.MY_2019,
          numberOfUnits: "0",
          dollarValuePerUnit: "0",
        },
      ];
    });
  }, []);

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => {
      return prev.filter((_line, lineIndex) => lineIndex !== index);
    });
  }, []);

  const handleLineChange = useCallback(
    (index: number, key: keyof CreditTransferLine, value: string) => {
      setLines((prev) => {
        return prev.map((line, lineIndex) => {
          if (lineIndex === index) {
            return { ...line, [key]: value };
          }
          return line;
        });
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const payload = getCreditTransferPayload(transferTo, lines);
        const response = await saveTransfer(payload, props.creditTransfer?.id);
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
  }, [props.creditTransfer, transferTo, lines]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex items-center py-2 my-2">
        <div className="w-72">
          <label>Transfer To:</label>
        </div>
        <div className="w-full">
          <Dropdown
            id="transferToOrg"
            placeholder="Select an Option"
            options={Object.entries(props.transferCandidatesMap).map(([id, name]) => ({
              value: id,
              label: name,
            }))}
            value={transferTo}
            onChange={handleTransferToSelect}
            disabled={!!props.creditTransfer || isPending}
          />
        </div>
      </div>
      <CreditTransferLines
        lines={lines}
        addLine={handleAddLine}
        removeLine={handleRemoveLine}
        handleLineChange={handleLineChange}
        disabled={isPending}
      />
      <div className="flex space-x-2">
        <Button variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
