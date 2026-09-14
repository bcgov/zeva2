"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { analystCreate, analystSave } from "../actions";
import {
  getModelYearEnumsToStringsMap,
  getVehicleClassEnumsToStringsMap,
  getZevClassEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { Button } from "@/app/lib/components";
import { Dropdown } from "@/app/lib/components/inputs";
import { getPenaltyCreditPayload } from "../utilsClient";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/enums";
import { useRouter } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { BackButton } from "@/app/lib/components/BackButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";

type NewProps = {
  type: "new";
  orgsMap: Partial<Record<number, string>>;
};

type SavedProps = {
  type: "saved";
  orgsMap: Partial<Record<number, string>>;
  penaltyCreditId: number;
  complianceYear: ModelYear;
  orgId: number;
  vehicleClass: VehicleClass;
  zevClass: ZevClass;
  modelYear: ModelYear;
  numberOfUnits: string;
};

export const PenaltyCreditForm = (props: NewProps | SavedProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<Partial<Record<string, string>>>({});
  const [orgsMap, setOrgsMap] = useState<Partial<Record<number, string>>>();
  const [penaltyCreditId, setPenaltyCreditId] = useState<number>();

  useEffect(() => {
    if (props.type === "new") {
      setOrgsMap(props.orgsMap);
    } else if (props.type === "saved") {
      setOrgsMap(props.orgsMap);
      setPenaltyCreditId(props.penaltyCreditId);
      setData({
        organizationId: props.orgId.toString(),
        complianceYear: props.complianceYear,
        vehicleClass: props.vehicleClass,
        zevClass: props.zevClass,
        modelYear: props.modelYear,
        numberOfUnits: props.numberOfUnits,
      });
    }
  }, []);

  const orgOptions = useMemo(() => {
    if (orgsMap) {
      return Object.entries(orgsMap).map(([id, name]) => {
        return {
          value: id,
          label: name ?? "",
        };
      });
    }
    return [];
  }, [orgsMap]);

  const yearOptions = useMemo(() => {
    const map = getModelYearEnumsToStringsMap();
    return Object.values(ModelYear)
      .filter((my) => my >= ModelYear.MY_2019 && my <= ModelYear.MY_2035)
      .map((my) => {
        return {
          value: my,
          label: map[my] ?? "",
        };
      });
  }, []);

  const vehicleClassOptions = useMemo(() => {
    const map = getVehicleClassEnumsToStringsMap();
    return Object.values(VehicleClass).map((vc) => {
      return {
        value: vc,
        label: map[vc] ?? "",
      };
    });
  }, []);

  const zevClassOptions = useMemo(() => {
    const map = getZevClassEnumsToStringsMap();
    return Object.values(ZevClass).map((zc) => {
      return {
        value: zc,
        label: map[zc] ?? "",
      };
    });
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setData((prev) => {
      return { ...prev, [key]: value };
    });
  }, []);

  const handleSave = useCallback(() => {
    setError("");
    startTransition(async () => {
      try {
        const payload = getPenaltyCreditPayload(data);
        let response;
        if (props.type === "new") {
          response = await analystCreate(payload);
        } else if (props.type === "saved" && penaltyCreditId) {
          response = await analystSave(
            penaltyCreditId,
            payload.vehicleClass,
            payload.zevClass,
            payload.modelYear,
            payload.numberOfUnits,
          );
        }
        if (response) {
          const responseType = response.responseType;
          if (responseType === "error") {
            throw new Error(response.message);
          } else if (props.type === "new" && responseType === "data") {
            router.push(`${Routes.PenaltyCredits}/${response.data}`);
          } else if (
            props.type === "saved" &&
            responseType === "success" &&
            penaltyCreditId
          ) {
            router.push(`${Routes.PenaltyCredits}/${penaltyCreditId}`);
          }
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        }
      }
    });
  }, [props.type, data, penaltyCreditId]);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-600">{error}</p>}
      <section className="overflow-hidden rounded border border-dividerMedium bg-white">
        <h2 className="bg-disabledSurface px-5 py-4 text-xl font-bold">
          Penalty Credit Details
        </h2>
        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
          <Dropdown
            label="Supplier"
            options={orgOptions}
            value={data.organizationId ?? ""}
            onChange={(value) => handleChange("organizationId", value)}
            disabled={props.type === "saved"}
          />

          <Dropdown
            label="Compliance Year"
            options={yearOptions}
            value={data.complianceYear ?? ""}
            onChange={(value) => handleChange("complianceYear", value)}
            disabled={props.type === "saved"}
          />

          <Dropdown
            label="Vehicle Class"
            options={vehicleClassOptions}
            value={data.vehicleClass ?? ""}
            onChange={(value) => handleChange("vehicleClass", value)}
          />

          <Dropdown
            label="ZEV Class"
            options={zevClassOptions}
            value={data.zevClass ?? ""}
            onChange={(value) => handleChange("zevClass", value)}
          />

          <Dropdown
            label="Model Year"
            options={yearOptions}
            value={data.modelYear ?? ""}
            onChange={(value) => handleChange("modelYear", value)}
          />
          <label className="flex flex-col gap-1">
            Number of Units
            <input
              type="text"
              value={data.numberOfUnits ?? ""}
              name="numberOfUnits"
              className="h-10 rounded border border-dividerMedium px-3"
              onChange={(e) => handleChange(e.target.name, e.target.value)}
            />
          </label>
        </div>
      </section>
      <footer className="flex min-h-20 items-center justify-between bg-gray-50 px-5">
        <BackButton />
        <Button
          variant="primary"
          disabled={isPending}
          onClick={handleSave}
          icon={<FontAwesomeIcon icon={faFloppyDisk} />}
          iconPosition="right"
        >
          {isPending ? "..." : "Save & Continue"}
        </Button>
      </footer>
    </div>
  );
};
