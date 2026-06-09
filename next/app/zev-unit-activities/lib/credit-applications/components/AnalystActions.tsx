"use client";

import { Button, Dropdown } from "@/app/lib/components";
import { CreditApplicationStatus, ModelYear } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { JSX, useCallback, useMemo, useState } from "react";
import {
  analystRecommend,
  analystReject,
  validateCreditApplication,
} from "../actions";
import { Routes } from "@/app/lib/constants";
import { Textarea } from "@/app/lib/components/inputs/Textarea";
import { getNormalizedComment } from "@/app/lib/utils/comment";
import { getModelYearEnumsToStringsMap } from "@/app/lib/utils/enumMaps";
import { Modal, ModalType } from "@/app/lib/components/Modal";
import { isModelYear } from "@/app/lib/utils/typeGuards";

export const AnalystActions = (props: {
  id: number;
  status: CreditApplicationStatus;
  validatedBefore: boolean;
  complianceYears: ModelYear[];
  defaultComplianceYear: ModelYear;
}) => {
  const router = useRouter();
  const [complianceYear, setComplianceYear] = useState<ModelYear>(
    props.defaultComplianceYear,
  );
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [modal, setModal] = useState<JSX.Element | null>(null);

  const modelYearsMap = useMemo(() => {
    return getModelYearEnumsToStringsMap();
  }, []);

  const handleSelectCy = useCallback((selectedCy: string) => {
    if (isModelYear(selectedCy)) {
      setComplianceYear(selectedCy);
    }
  }, []);

  const handleValidate = useCallback(async () => {
    const response = await validateCreditApplication(props.id);
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(`${Routes.CreditApplications}/${props.id}/validated`);
    }
    setModal(null);
  }, [props.id]);

  const handleGoToValidated = useCallback(
    (edit: boolean) => {
      router.push(
        `${Routes.CreditApplications}/${props.id}/validated${edit ? "" : "?readOnly=Y"}`,
      );
    },
    [props.id, router],
  );

  const handleRecommend = useCallback(async () => {
    try {
      const response = await analystRecommend(
        props.id,
        complianceYear,
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
    setModal(null);
  }, [props.id, complianceYear, comment]);

  const handleReject = useCallback(async () => {
    const response = await analystReject(
      props.id,
      getNormalizedComment(comment),
    );
    if (response.responseType === "error") {
      setError(response.message);
    } else {
      router.push(Routes.CreditApplications);
    }
    setModal(null);
  }, [props.id, comment]);

  const showModal = useCallback(
    (type: "validate" | "recommend" | "reject") => {
      let modalType: ModalType | undefined;
      let action: (() => Promise<void>) | undefined;
      if (type === "validate") {
        modalType = "warning";
        action = handleValidate;
      } else if (type === "recommend") {
        modalType = "confirmation";
        action = handleRecommend;
      } else if (type === "reject") {
        modalType = "error";
        action = handleReject;
      }
      if (modalType && action) {
        setModal(
          <Modal
            showModal={true}
            modalType={modalType}
            handleSubmit={action}
            handleCancel={() => setModal(null)}
          />,
        );
      }
    },
    [handleValidate, handleRecommend, handleReject],
  );

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
      >
        View Validated Records
      </Button>
    );
  }
  return (
    <>
      <Textarea value={comment} onChange={setComment} />
      {error && <p className="text-red-600">{error}</p>}
      {props.validatedBefore ? (
        <div className="flex flex-row justify-between">
          <div className="flex flex-row items-center gap-3">
            <Button variant="danger" onClick={() => showModal("reject")}>
              Reject
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                handleGoToValidated(false);
              }}
            >
              View Validated Records
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                handleGoToValidated(true);
              }}
            >
              Edit Validated Records
            </Button>
            <Button variant="primary" onClick={() => showModal("validate")}>
              Validate
            </Button>
          </div>
          <div className="flex flex-row items-center gap-3">
            <Dropdown
              label="Compliance Year"
              options={props.complianceYears.map((cy) => {
                return {
                  value: cy,
                  label: modelYearsMap[cy] ?? "",
                };
              })}
              onChange={(value) => {
                handleSelectCy(value);
              }}
              value={complianceYear}
            />
            <Button variant="primary" onClick={() => showModal("recommend")}>
              Recommend Approval
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-row justify-between">
          <Button variant="danger" onClick={() => showModal("reject")}>
            Reject
          </Button>
          <Button variant="primary" onClick={() => showModal("validate")}>
            Validate
          </Button>
        </div>
      )}
      {modal}
    </>
  );
};
