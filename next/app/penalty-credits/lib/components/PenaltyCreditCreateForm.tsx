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
import { Dropdown } from "@/app/lib/components/inputs";
import { getPenaltyCreditPayload } from "../utilsClient";
import { ZevClass } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";

export const PenaltyCreditCreateForm = (props: {
  orgNamesAndIds: OrgNamesAndIds[];
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<Partial<Record<string, string>>>({});

  const orgOptions = useMemo(() => {
    return props.orgNamesAndIds.map((element) => ({
      value: element.id.toString(),
      label: element.name,
    }));
  }, [props.orgNamesAndIds]);

  const yearOptions = useMemo(() => {
    return Object.entries(getStringsToModelYearsEnumsMap()).map(([key, value]) => ({
      value: key,
      label: key,
    }));
  }, []);

  const vehicleClassOptions = useMemo(() => {
    return Object.entries(getStringsToVehicleClassEnumsMap()).map(([key, value]) => ({
      value: key,
      label: key,
    }));
  }, []);

  const zevClassOptions = useMemo(() => {
    const zevClassMap = getStringsToZevClassEnumsMap();
    return Object.entries(zevClassMap)
      .filter(([_s, e]) => e === ZevClass.A || e === ZevClass.UNSPECIFIED)
      .map(([s, _e]) => ({
        value: s,
        label: s,
      }));
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

      <Dropdown
        label="Supplier"
        options={orgOptions}
        value={data.organizationId ?? ""}
        onChange={(value) => handleChange("organizationId", value)}
        className="mb-2"
      />

      <Dropdown
        label="Compliance Year"
        options={yearOptions}
        value={data.complianceYear ?? ""}
        onChange={(value) => handleChange("complianceYear", value)}
        className="mb-2"
      />

      <Dropdown
        label="Vehicle Class"
        options={vehicleClassOptions}
        value={data.vehicleClass ?? ""}
        onChange={(value) => handleChange("vehicleClass", value)}
        className="mb-2"
      />

      <Dropdown
        label="ZEV Class"
        options={zevClassOptions}
        value={data.zevClass ?? ""}
        onChange={(value) => handleChange("zevClass", value)}
        className="mb-2"
      />

      <Dropdown
        label="Model Year"
        options={yearOptions}
        value={data.modelYear ?? ""}
        onChange={(value) => handleChange("modelYear", value)}
        className="mb-2"
      />

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

      <Button variant="primary" disabled={isPending} onClick={handleSubmit}>
        {isPending ? "..." : "Submit"}
      </Button>
    </div>
  );
};
