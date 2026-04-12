"use client";

import { Button, Dropdown } from "@/app/lib/components";
import { CreditApplicationStatus } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  analystRecommend,
  analystReject,
  validateCreditApplication,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { getStringsToModelYearsEnumsMap } from "@/app/lib/utils/enumMaps";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  validatedBefore: boolean;
  complianceYears: string[];
  defaultComplianceYear: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [complianceYear, setComplianceYear] = useState<string>(
    props.defaultComplianceYear,
  );
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");

  const modelYearsMap = useMemo(() => {
    return getStringsToModelYearsEnumsMap();
  }, []);

  const handleSelectCy = useCallback((selectedCy: string) => {
    setComplianceYear(selectedCy);
  }, []);

  const handleValidate = useCallback(() => {
    startTransition(async () => {
      const response = await validateCreditApplication(props.id);
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(`${Routes.CreditApplications}/${props.id}/validated`);
      }
    });
  }, [props.id]);

  const handleGoToValidated = useCallback(
    (edit: boolean) => {
      startTransition(() => {
        router.push(
          `${Routes.CreditApplications}/${props.id}/validated${edit ? "" : "?readOnly=Y"}`,
        );
      });
    },
    [props.id, router],
  );

  const handleRecommend = useCallback(() => {
    startTransition(async () => {
      try {
        const cyEnum = modelYearsMap[complianceYear];
        if (!cyEnum) {
          throw new Error("You must select a compliance year!");
        }
        const response = await analystRecommend(
          props.id,
          cyEnum,
          getNormalizedComment(comment),
        );
        if (response.responseType === "error") {
          throw new Error(response.message);
        } else {
          router.refresh();
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.id, complianceYear, comment]);

  const handleReject = useCallback(() => {
    startTransition(async () => {
      const response = await analystReject(
        props.id,
        getNormalizedComment(comment),
      );
      if (response.responseType === "error") {
        setError(response.message);
      } else {
        router.push(Routes.CreditApplications);
      }
    });
  }, [props.id, comment]);

  if (
    props.status === CreditApplicationStatus.DRAFT ||
    props.status === CreditApplicationStatus.REJECTED
  ) {
    return null;
  }
  if (
    props.status === CreditApplicationStatus.APPROVED ||
    props.status === CreditApplicationStatus.RECOMMEND_APPROVAL
  ) {
    return (
      <Button
        variant="secondary"
        onClick={() => {
          handleGoToValidated(false);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "View Validated Records"}
      </Button>
    );
  }
  return (
    <>
      {error && <p className="text-red-600">{error}</p>}
      <Textarea value={comment} onChange={setComment} disabled={isPending} />
      <Button variant="primary" onClick={handleValidate} disabled={isPending}>
        {isPending ? "..." : "Validate"}
      </Button>
      <Button variant="primary" onClick={handleReject} disabled={isPending}>
        {isPending ? "..." : "Reject"}
      </Button>
      {props.validatedBefore && (
        <>
          <Button
            variant="secondary"
            onClick={() => {
              handleGoToValidated(false);
            }}
            disabled={isPending}
          >
            {isPending ? "..." : "View Validated Records"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              handleGoToValidated(true);
            }}
            disabled={isPending}
          >
            {isPending ? "..." : "Edit Validated Records"}
          </Button>
          <Dropdown
            options={props.complianceYears.map((cy) => {
              return {
                value: cy,
                label: cy,
              };
            })}
            onChange={(value) => {
              handleSelectCy(value);
            }}
          />
          <Button
            variant="primary"
            onClick={() => {
              handleRecommend();
            }}
            disabled={isPending}
          >
            {isPending ? "..." : "Recommend Approval"}
          </Button>
        </>
      )}
    </>
  );
};
