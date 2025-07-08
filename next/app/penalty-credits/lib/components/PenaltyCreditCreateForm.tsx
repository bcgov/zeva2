"use client";

import { JSX, useCallback, useMemo, useState, useTransition } from "react";
import { analystSubmit } from "../actions";
import { OrgNamesAndIds } from "../data";
import {
  getStringsToModelYearsEnumsMap,
  getStringsToVehicleClassEnumsMap,
  getStringsToZevClassEnumsMap,
} from "@/app/lib/utils/enumMaps";
import { Button } from "@/app/lib/components";
import { getPenaltyCreditPayload } from "../utilsClient";
import { ZevClass } from "@/prisma/generated/client";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export const PenaltyCreditCreateForm = (props: {
  orgNamesAndIds: OrgNamesAndIds[];
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<Partial<Record<string, string>>>({});

  const getOptions = useCallback((map: Record<string, any>) => {
    return Object.keys(map).map((key) => {
      return (
        <option key={key} value={key}>
          {key}
        </option>
      );
    });
  }, []);

  const orgOptions = useMemo(() => {
    return props.orgNamesAndIds.map((element) => {
      return (
        <option value={element.id} key={element.id}>
          {element.name}
        </option>
      );
    });
  }, [props.orgNamesAndIds]);

  const yearOptions = useMemo(() => {
    return getOptions(getStringsToModelYearsEnumsMap());
  }, []);

  const vehicleClassOptions = useMemo(() => {
    return getOptions(getStringsToVehicleClassEnumsMap());
  }, []);

  const zevClassOptions = useMemo(() => {
    const result: JSX.Element[] = [];
    const zevClassMap = getStringsToZevClassEnumsMap();
    for (const [s, e] of Object.entries(zevClassMap)) {
      if (e === ZevClass.A || e === ZevClass.UNSPECIFIED) {
        result.push(
          <option key={s} value={s}>
            {s}
          </option>,
        );
      }
    }
    return result;
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setData((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        const payload = getPenaltyCreditPayload(data);
        const response = await analystSubmit(payload);
        if (response.responseType === "error") {
          throw new Error(response.message);
        }
        router.push(`${Routes.PenaltyCredit}/${response.data}`);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [data, router]);

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}

      <select
        value={data.organizationId}
        name={"organizationId"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      >
        <option value={""} key={-1}>
          Supplier
        </option>
        {orgOptions}
      </select>

      <select
        value={data.complianceYear}
        name={"complianceYear"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      >
        <option value={""} key={-1}>
          Compliance Year
        </option>
        {yearOptions}
      </select>

      <select
        value={data.vehicleClass}
        name={"vehicleClass"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      >
        <option value={""} key={-1}>
          Vehicle Class
        </option>
        {vehicleClassOptions}
      </select>

      <select
        value={data.zevClass}
        name={"zevClass"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      >
        <option value={""} key={-1}>
          ZEV Class
        </option>
        {zevClassOptions}
      </select>

      <select
        value={data.modelYear}
        name={"modelYear"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      >
        <option value={""} key={-1}>
          Model Year
        </option>
        {yearOptions}
      </select>

      <input
        type="text"
        placeholder="Number of Units"
        value={data.numberOfUnits ?? ""}
        name={"numberOfUnits"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      />

      <input
        type="text"
        placeholder="Comment (optional)"
        value={data.comment ?? ""}
        name={"comment"}
        className="border p-2 w-full"
        onChange={(e) => {
          handleChange(e.target.name, e.target.value);
        }}
      />

      <Button disabled={isPending} onClick={handleSubmit}>
        {isPending ? "..." : "Submit"}
      </Button>
    </div>
  );
};
