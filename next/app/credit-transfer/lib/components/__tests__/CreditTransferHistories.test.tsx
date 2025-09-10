import React from "react";
import { render, screen } from "@testing-library/react";
import { CreditTransferHistories } from "../CreditTransferHistories";

jest.mock("@/auth", () => ({ getUserInfo: jest.fn().mockResolvedValue({ userIsGov: true }) }));
jest.mock("@/app/lib/utils/enumMaps", () => ({ getCreditTransferStatusEnumsToStringsMap: () => ({ SUBMITTED_TO_TRANSFER_TO: "Submitted" }) }));
jest.mock("@/app/lib/utils/date", () => ({ getIsoYmdString: () => "2024-01-01", getTimeWithTz: () => "12:00 PST" }));
jest.mock("../../data", () => ({ getCreditTransferHistories: jest.fn().mockResolvedValue([{ id: 1, userAction: "SUBMITTED_TO_TRANSFER_TO", timestamp: new Date(), comment: "Note", user: { firstName: "F", lastName: "L", organization: { isGovernment: false } } }]) }));

describe("CreditTransferHistories", () => {
  test("renders list", async () => {
    render(await CreditTransferHistories({ id: 1 }));
    expect(screen.getByText(/made the transfer/)).toBeInTheDocument();
    expect(screen.getByText(/Comment associated/)).toBeInTheDocument();
  });
});

