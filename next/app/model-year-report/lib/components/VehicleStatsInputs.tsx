"use client";

import { Dispatch, SetStateAction, useCallback } from "react";
import { Button } from "@/app/lib/components";
import { VehicleStatString } from "../utils";

export const VehicleStatsInput = (props: {
  stats: VehicleStatString[];
  setStats: Dispatch<SetStateAction<VehicleStatString[]>>;
  disabled: boolean;
}) => {
  const handleChange = useCallback(
    (index: number, key: keyof VehicleStatString, value: string) => {
      props.setStats((prev) => {
        return prev.map((stat, statIndex) => {
          if (statIndex === index) {
            return { ...stat, [key]: value };
          }
          return stat;
        });
      });
    },
    [],
  );

  const handleAdd = useCallback(() => {
    props.setStats((prev) => {
      return [...prev, {}];
    });
  }, []);

  const handleDelete = useCallback((index: number) => {
    props.setStats((prev) =>
      prev.filter((_element, statIndex) => statIndex !== index),
    );
  }, []);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th className="border border-gray-300">Vehicle Class</th>
            <th className="border border-gray-300">ZEV Class</th>
            <th className="border border-gray-300">Make</th>
            <th className="border border-gray-300">Model Name</th>
            <th className="border border-gray-300">Model Year</th>
            <th className="border border-gray-300">ZEV Type</th>
            <th className="border border-gray-300">Range</th>
            <th className="border border-gray-300">Pending Issuance Count</th>
            <th className="border border-gray-300">Issued Count</th>
          </tr>
        </thead>
        <tbody>
          {props.stats.map((stat, index) => (
            <tr key={index}>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.vehicleClass ?? ""}
                  onChange={(e) =>
                    handleChange(index, "vehicleClass", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.zevClass ?? ""}
                  onChange={(e) =>
                    handleChange(index, "zevClass", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.make ?? ""}
                  onChange={(e) => handleChange(index, "make", e.target.value)}
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.modelName ?? ""}
                  onChange={(e) =>
                    handleChange(index, "modelName", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.modelYear ?? ""}
                  onChange={(e) =>
                    handleChange(index, "modelYear", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.zevType ?? ""}
                  onChange={(e) =>
                    handleChange(index, "zevType", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.range ?? ""}
                  onChange={(e) => handleChange(index, "range", e.target.value)}
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.submittedCount ?? ""}
                  onChange={(e) =>
                    handleChange(index, "submittedCount", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <input
                  type="text"
                  value={stat.issuedCount ?? ""}
                  onChange={(e) =>
                    handleChange(index, "issuedCount", e.target.value)
                  }
                  disabled={props.disabled}
                />
              </td>
              <td className="border border-gray-300">
                <Button
                  variant="danger"
                  onClick={() => handleDelete(index)}
                  disabled={props.disabled}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button onClick={handleAdd} disabled={props.disabled}>
        Add Line
      </Button>
    </>
  );
};
