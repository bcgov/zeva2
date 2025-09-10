import React from "react";
import { render, screen } from "@testing-library/react";
import { CreditTransferDetails } from "../CreditTransferDetails";

jest.mock("@/auth", () => ({ getUserInfo: jest.fn().mockResolvedValue({ userIsGov: false }) }));
jest.mock("@/app/model-year-report/lib/utilsClient", () => ({ getHelpingMaps: () => ({ vehicleClassesMap: { REPORTABLE: "Reportable" }, zevClassesMap: { A: "A" }, modelYearsMap: { MY_2024: "2024" } }) }));
jest.mock("@/app/lib/utils/enumMaps", () => ({ getCreditTransferStatusEnumsToStringsMap: () => ({ SUBMITTED_TO_TRANSFER_TO: "Submitted" }) }));
jest.mock("../../data", () => ({ getCreditTransfer: jest.fn().mockResolvedValue({ id: 1, transferFrom: { name: "A" }, transferTo: { name: "B" }, status: "SUBMITTED_TO_TRANSFER_TO", supplierStatus: "SUBMITTED_TO_TRANSFER_TO", creditTransferContent: [{ id: 10, vehicleClass: "REPORTABLE", zevClass: "A", modelYear: "MY_2024", numberOfUnits: { toString: () => "5", times: (d: any) => ({ toString: () => "50" }) }, dollarValuePerUnit: { toString: () => "10" } }] }) }));

describe("CreditTransferDetails", () => {
  test("renders details and content", async () => {
    render(await CreditTransferDetails({ id: 1 }));
    expect(screen.getByText(/Transfer From: A/)).toBeInTheDocument();
    expect(screen.getByText(/Vehicle Class: Reportable/)).toBeInTheDocument();
  });
});

