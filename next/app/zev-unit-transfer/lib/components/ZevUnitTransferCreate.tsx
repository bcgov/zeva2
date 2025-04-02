"use client";

import { Button, ContentCard } from "@/app/lib/components";
import { useState, useMemo, useCallback, JSX } from "react";
import { ModelYear, VehicleClass, ZevClass } from "@/prisma/generated/client";
import { getOptions } from "@/app/lib/utils/jsxHelpers";
import {
  getModelYearEnumMap,
  getVehicleClassEnumMap,
  getZevClassEnumMap,
} from "@/app/lib/utils/enumMaps";
import {
  ZevUnitTransferContentPayload,
  ZevUnitTransferPayload,
} from "../actions";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";

const ZevUnitTransferCreate = (props: {
  transferCandidatesMap: { [key: number]: string };
  onSubmit: (data: ZevUnitTransferPayload) => Promise<void>;
}) => {
  const [transferTo, setTransferTo] = useState<number>(
    parseInt(Object.keys(props.transferCandidatesMap)[0]),
  );
  const [content, setContent] = useState<ZevUnitTransferContentPayload[]>([]);
  //todo: investigate if <Suspense> will work with server actions; if so, there's no need for this createPending state
  const [createPending, setCreatePending] = useState<boolean>(false);

  const handleSelectPartner = useCallback((orgId: number) => {
    setTransferTo(orgId);
  }, []);

  const handleContentAdd = useCallback(() => {
    setContent((prev) => {
      const newContent = [...prev];
      newContent.push({
        vehicleClass: VehicleClass.REPORTABLE,
        zevClass: ZevClass.A,
        modelYear: ModelYear.MY_2019,
        numberOfUnits: "",
        dollarValuePerUnit: "",
      });
      return newContent;
    });
  }, []);

  const handleContentRemove = useCallback((index: number) => {
    setContent((prev) => {
      const newContent = [];
      for (let i = 0; i < prev.length; i++) {
        if (i !== index) {
          newContent.push(prev[i]);
        }
      }
      return newContent;
    });
  }, []);

  const handleContentChange = useCallback(
    (
      index: number,
      key: keyof ZevUnitTransferContentPayload,
      value: string,
    ) => {
      setContent((prev) => {
        const contentToUpdate = { ...prev[index] };
        contentToUpdate[key] = value;
        const newContent = [...prev];
        newContent[index] = contentToUpdate;
        return newContent;
      });
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    // todo: maybe some client-side validation here?
    setCreatePending(true);
    try {
      // if the submit is successful, will redirect user to created transfer
      await props.onSubmit({
        transferToId: transferTo,
        zevUnitTransferContent: content,
      });
    } catch (e) {
      // todo: show some sort of error message
      setCreatePending(false);
      console.log("zev unit transfer validation error!");
    }
  }, [props.onSubmit, transferTo, content]);

  const transferOptions = useMemo(() => {
    const result = [];
    for (const [orgId, orgName] of Object.entries(
      props.transferCandidatesMap,
    )) {
      result.push(
        <option key={orgId} value={orgId}>
          {orgName}
        </option>,
      );
    }
    return result;
  }, [props.transferCandidatesMap]);

  const vehicleClassOptions = useMemo(() => {
    const map = getVehicleClassEnumMap();
    return getOptions(map);
  }, []);

  const zevClassOptions = useMemo(() => {
    const map = getZevClassEnumMap();
    delete map[ZevClass.C];
    delete map[ZevClass.UNSPECIFIED];
    return getOptions(map);
  }, []);

  const modelYearOptions = useMemo(() => {
    const map = getModelYearEnumMap();
    return getOptions(map);
  }, []);

  const contentTypeMap = useMemo(() => {
    const result: Record<
      keyof ZevUnitTransferContentPayload,
      [number, JSX.Element[]?]
    > = {
      vehicleClass: [0, vehicleClassOptions],
      zevClass: [1, zevClassOptions],
      modelYear: [2, modelYearOptions],
      numberOfUnits: [3],
      dollarValuePerUnit: [4],
    };
    return result;
  }, []);

  const contentJSX = useMemo(() => {
    const result = [];
    for (let index = 0; index < content.length; index++) {
      const subResult = [];
      const item = content[index];
      for (const [key, value] of Object.entries(item)) {
        if (
          key === "vehicleClass" ||
          key === "zevClass" ||
          key === "modelYear"
        ) {
          const innerIndex = contentTypeMap[key][0];
          const options = contentTypeMap[key][1];
          if (options) {
            subResult[innerIndex] = (
              <select
                key={key}
                value={value}
                onChange={(event) => {
                  handleContentChange(index, key, event.target.value);
                }}
              >
                {options}
              </select>
            );
          }
        } else if (key === "numberOfUnits" || key === "dollarValuePerUnit") {
          const innerIndex = contentTypeMap[key][0];
          let placeholder = "number of units";
          if (key === "dollarValuePerUnit") {
            placeholder = " dollar value per unit";
          }
          subResult[innerIndex] = (
            <input
              className="border-2 border-solid"
              placeholder={placeholder}
              key={key}
              onChange={(event) => {
                handleContentChange(index, key, event.target.value);
              }}
            />
          );
        }
      }
      result.push(
        <div key={index}>
          {subResult}
          <Button
            key={"remove"}
            onClick={() => {
              handleContentRemove(index);
            }}
          >
            Remove line
          </Button>
        </div>,
      );
    }
    return result;
  }, [content, contentTypeMap, handleContentChange]);

  return (
    <div className="flex flex-col w-1/3">
      <ContentCard title="Transfer Partner">
        <select
          value={transferTo}
          onChange={(event) => {
            handleSelectPartner(parseInt(event.target.value));
          }}
        >
          {transferOptions}
        </select>
      </ContentCard>
      <ContentCard title="Transfer Contents">{contentJSX}</ContentCard>
      <ContentCard title="Actions">
        {createPending ? (
          <LoadingSkeleton />
        ) : (
          <>
            <Button onClick={handleContentAdd}>Add line item</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </>
        )}
      </ContentCard>
    </div>
  );
};

export default ZevUnitTransferCreate;
