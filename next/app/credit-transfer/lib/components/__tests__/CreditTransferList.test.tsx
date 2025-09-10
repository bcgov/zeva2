import React from "react";
import { render, screen } from "@testing-library/react";
import { CreditTransferList } from "../CreditTransferList";

jest.mock("@/auth", () => ({ getUserInfo: jest.fn().mockResolvedValue({ userIsGov: false }) }));
jest.mock("../../data", () => ({ getCreditTransfers: jest.fn().mockResolvedValue([[{ id: 1, status: "SUBMITTED_TO_TRANSFER_TO", supplierStatus: "APPROVED_BY_TRANSFER_TO", transferFrom: { name: "A" }, transferTo: { name: "B" } }], 1]) }));
jest.mock("../CreditTransfersTable", () => ({ CreditTransfersTable: (props: any) => <div data-testid="table" data-props={JSON.stringify(props)} /> }));

describe("CreditTransferList", () => {
  test("fetches and passes serialized data", async () => {
    render(
      await CreditTransferList({ page: 1, pageSize: 10, filters: {}, sorts: {} } as any),
    );
    const table = screen.getByTestId("table");
    const props = JSON.parse(table.getAttribute("data-props") || "{}");
    expect(props.totalNumbeOfTransfers).toBe(1);
    expect(props.transfers[0].id).toBe(1);
  });
});

