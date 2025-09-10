import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreditTransferLines } from "../CreditTransferLines";

jest.mock("@/app/lib/components", () => ({ Button: (props: any) => <button {...props} /> }));
jest.mock("@/app/lib/components/skeletons", () => ({ LoadingSkeleton: () => <div>Loading...</div> }));
jest.mock("@/app/lib/utils/enumMaps", () => ({
  getStringsToVehicleClassEnumsMap: () => ({ Reportable: "REPORTABLE" }),
  getStringsToZevClassEnumsMap: () => ({ A: "A" }),
  getStringsToModelYearsEnumsMap: () => ({ 2024: "MY_2024" }),
}));

describe("CreditTransferLines", () => {
  test("renders disabled skeleton", () => {
    render(
      <CreditTransferLines
        lines={[]}
        addLine={jest.fn()}
        removeLine={jest.fn()}
        handleLineChange={jest.fn()}
        disabled={true}
      />,
    );
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  test("handles selects, inputs and remove", () => {
    const onAdd = jest.fn();
    const onRemove = jest.fn();
    const onChange = jest.fn();
    render(
      <CreditTransferLines
        lines={[{ id: "1", vehicleClass: "REPORTABLE", zevClass: "A", modelYear: "MY_2024" }] as any}
        addLine={onAdd}
        removeLine={onRemove}
        handleLineChange={onChange}
        disabled={false}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Vehicle Class/), { target: { value: "REPORTABLE" } });
    fireEvent.change(screen.getByLabelText(/ZEV Class/), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText(/Model Year/), { target: { value: "MY_2024" } });
    fireEvent.change(screen.getByLabelText(/Number of Units/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/Dollar Value per Unit/), { target: { value: "2" } });
    fireEvent.click(screen.getByText(/Remove Line/));
    fireEvent.click(screen.getByText(/Add Line/));
    expect(onRemove).toHaveBeenCalled();
    expect(onAdd).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });
});

