"use client";

import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Routes } from "@/app/lib/constants";
import { CreditTransferLine, CreditTransferLines } from "./CreditTransferLines";
import { saveTransfer } from "../actions";
import { getCreditTransferPayload } from "../utilsClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSave, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const defaultLine: CreditTransferLine = {
  vehicleClass: "",
  zevClass: "",
  modelYear: "",
  numberOfUnits: "",
  dollarValuePerUnit: "",
};

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
  const [lines, setLines] = useState<CreditTransferLine[]>([{ ...defaultLine }]);
  const [needsSave, setNeedsSave] = useState<boolean>(false);

  useEffect(() => {
    if (props.creditTransfer) {
      setTransferTo(props.creditTransfer.transferTo.toString());
      setLines(props.creditTransfer.lines);
      setNeedsSave(true);
    }
  }, []);

  const handleTransferToSelect = useCallback((transferToId: string) => {
    setTransferTo(transferToId);
    setNeedsSave(true);
  }, []);

  const handleAddLine = useCallback(() => {
    setLines((prev) => [...prev, { ...defaultLine }]);
    setNeedsSave(true);
  }, []);

  const handleRemoveLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_line, lineIndex) => lineIndex !== index));
    setNeedsSave(true);
  }, []);

  const handleLineChange = useCallback(
    (index: number, key: keyof CreditTransferLine, value: string) => {
      setLines((prev) =>
        prev.map((line, lineIndex) => {
          if (lineIndex === index) {
            return { ...line, [key]: value };
          }
          return line;
        }),
      );
      setNeedsSave(true);
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

  const handleBack = useCallback(() => {
    router.push(Routes.CreditTransfers);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded border border-error bg-red-50 px-4 py-2 text-sm text-error">
          {error}
        </p>
      )}

      {/* Transfer Details card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-level-1">
        {/* Gray header */}
        <div className="border-b border-gray-200 bg-gray-100 px-6 py-3">
          <span className="font-semibold text-primaryText">Transfer Details</span>
        </div>

        <div className="p-6">
          {/* Transfer To dropdown */}
          <div className="mb-6 max-w-sm">
            <label className="mb-1 block text-sm font-medium text-primaryText">
              Transfer to
            </label>
            <Dropdown
              id="transferToOrg"
              placeholder="Select an Option"
              options={Object.entries(props.transferCandidatesMap).map(
                ([id, name]) => ({
                  value: id,
                  label: name,
                }),
              )}
              value={transferTo}
              onChange={handleTransferToSelect}
              disabled={!!props.creditTransfer || isPending}
            />
          </div>

          {/* Line items table */}
          <CreditTransferLines
            lines={lines}
            addLine={handleAddLine}
            removeLine={handleRemoveLine}
            handleLineChange={handleLineChange}
            disabled={isPending}
          />

          {/* Add Another Line button */}
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={handleAddLine}
              disabled={isPending}
              icon={<FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />}
            >
              Add Another Line
            </Button>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={isPending}
          icon={<FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />}
        >
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!needsSave || isPending}
          icon={<FontAwesomeIcon icon={faSave} className="h-3.5 w-3.5" />}
          iconPosition="right"
        >
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

