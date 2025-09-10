import React from "react";
import { render } from "@testing-library/react";
import { CreditTransfersTable } from "../CreditTransfersTable";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const mockTable = jest.fn(() => <div />);
jest.mock("@/app/lib/components", () => ({ Table: (props: any) => mockTable(props) }));

jest.mock("@/app/lib/utils/enumMaps", () => ({ getCreditTransferStatusEnumsToStringsMap: () => ({ SUBMITTED_TO_TRANSFER_TO: "Submitted" }) }));

describe("CreditTransfersTable", () => {
  beforeEach(() => { mockTable.mockClear(); push.mockClear(); });

  test("passes columns and data to Table and navigation works", () => {
    render(
      <CreditTransfersTable
        transfers={[{ id: 5, transferFrom: { name: "A" }, transferTo: { name: "B" }, status: "SUBMITTED_TO_TRANSFER_TO" } as any]}
        totalNumbeOfTransfers={10}
      />,
    );
    expect(mockTable).toHaveBeenCalled();
    const props = mockTable.mock.calls[0][0];
    expect(props.data[0].id).toBe(5);
    // simulate navigationAction
    props.navigationAction(5);
    expect(push).toHaveBeenCalled();
  });
});

