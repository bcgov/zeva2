"use client";

import { Button, TextInput } from "@/app/lib/components";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export const Makes = (props: {
  makes: string[];
  setMakes?: Dispatch<SetStateAction<string[]>>;
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
    <div className="flex flex-col border border-dividerMedium/40">
      <div className="p-2 bg-gray-100 font-lg font-semibold">Vehicle Makes</div>
      {props.setMakes && (
        <div className="flex flex-row gap-2 p-2 items-end">
          <TextInput
            label="Makes"
            placeholder="Enter Make"
            value={newMake}
            onChange={(enteredMake) => setNewMake(enteredMake)}
          />
          <Button onClick={() => handleAdd(newMake)} variant="secondary">
            Add Make
          </Button>
        </div>
      )}
      <div className="flex flex-col divide-y divide-dividerMedium/30 border border-dividerMedium/40 p-2">
        <div className="flex flex-row justify-between p-2">
          <span className="font-semibold">Make</span>
          <span className="font-semibold">Delete</span>
        </div>
        {props.makes.map((make, index) => {
          return (
            <div
              key={index}
              className={`flex flex-row justify-between p-2 ${index % 2 === 0 ? "bg-gray-50" : ""}`}
            >
              <span>{make}</span>
              {props.setMakes && (
                <FontAwesomeIcon
                  icon={faTrash}
                  className="text-primaryRed cursor-pointer"
                  onClick={() => handleDelete(index)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
