"use client";

import { Button, TextInput } from "@/app/lib/components";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export const Makes = (props: {
  makes: string[];
  setMakes?: Dispatch<SetStateAction<string[]>>;
  disabled: boolean;
  supplierName?: string;
}) => {
  const [newMake, setNewMake] = useState<string>("");

  const handleAdd = useCallback(
    (make: string) => {
      const refinedMake = make.trim();
      if (refinedMake && props.setMakes) {
        props.setMakes((prev) => {
          return [...prev, make];
        });
        setNewMake("");
      }
    },
    [props.setMakes],
  );

  const handleDelete = useCallback(
    (index: number) => {
      if (props.setMakes) {
        props.setMakes((prev) => {
          return prev.toSpliced(index, 1);
        });
      }
    },
    [props.setMakes],
  );

  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="flex flex-col px-5 py-4 bg-disabledBG gap-2">
        <span className="text-xl font-bold">Vehicle Makes</span>
        {props.supplierName && (
          <span>
            Enter all vehicle makes for which {props.supplierName} is the
            supplier.
          </span>
        )}
      </div>
      <div className=" w-1/3 flex flex-col gap-5 p-5">
        {props.setMakes && (
          <div className="flex flex-row gap-4 justify-between items-end">
            <TextInput
              label="Makes"
              placeholder="Enter Make"
              value={newMake}
              onChange={(enteredMake) => setNewMake(enteredMake)}
              disabled={props.disabled}
            />
            <Button
              onClick={() => handleAdd(newMake)}
              variant="secondary"
              disabled={props.disabled}
            >
              Add Make
            </Button>
          </div>
        )}
        <div className="flex flex-col divide-y divide-dividerMedium border border-dividerMedium rounded">
          <div className="flex flex-row justify-between px-4 py-3">
            <span className="text-sm font-bold">Make</span>
            {props.setMakes && (
              <span className="text-sm font-bold">Delete</span>
            )}
          </div>
          {props.makes.map((make, index) => {
            return (
              <div
                key={index}
                className={`flex flex-row justify-between px-4 py-3 ${index % 2 === 0 ? "bg-lightGrey" : ""}`}
              >
                <span>{make}</span>
                {props.setMakes &&
                  (props.disabled ? (
                    <FontAwesomeIcon icon={faTrash} className="text-gray-500" />
                  ) : (
                    <FontAwesomeIcon
                      icon={faTrash}
                      className="text-primaryRed cursor-pointer"
                      onClick={() => handleDelete(index)}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
