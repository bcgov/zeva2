"use client";

import axios from "axios";
import { Button } from "@/app/lib/components";
import { useCallback, useTransition } from "react";
import { CreditApplicationStatus } from "@/prisma/generated/client";
import { analystRecommend, getCreditApplicationPutData } from "../actions";
import { useRouter } from "next/navigation";

export const AnalystActions = (props: {
  creditApplicationId: number;
  file: File;
  fileName: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const recommend = useCallback(
    (status: CreditApplicationStatus) => {
      startTransition(async () => {
        try {
          const putData = await getCreditApplicationPutData();
          if (putData) {
            const objectName = putData.objectName;
            const url = putData.url;
            await axios.put(url, props.file);
            await analystRecommend(
              props.creditApplicationId,
              status,
              objectName,
              props.fileName,
            );
            router.refresh();
          }
        } catch (e) {
          console.error(e);
        }
      });
    },
    [props, router, startTransition],
  );

  return (
    <>
      <Button
        onClick={() => {
          recommend(CreditApplicationStatus.RECOMMEND_APPROVAL);
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Recommend Approval"}
      </Button>
      <Button onClick={() => {}} disabled={isPending}>
        {isPending ? "..." : "Recommend Rejection"}
      </Button>
      <Button onClick={() => {}} disabled={isPending}>
        {isPending ? "..." : "Return to Supplier"}
      </Button>
    </>
  );
};
