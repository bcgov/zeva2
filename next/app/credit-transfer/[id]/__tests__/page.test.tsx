import React from "react";
import Page from "../page";
import { render, screen } from "@testing-library/react";

jest.mock("@/auth", () => ({
  getUserInfo: jest.fn(),
}));

jest.mock("../../lib/services", () => ({
  getTransfer: jest.fn(),
}));

jest.mock("../../lib/components/CreditTransferHistories", () => ({
  CreditTransferHistories: ({ id }: any) => <div>Histories {id}</div>,
}));
jest.mock("../../lib/components/CreditTransferDetails", () => ({
  CreditTransferDetails: ({ id }: any) => <div>Details {id}</div>,
}));
jest.mock("../../lib/components/TransferFromActions", () => ({
  TransferFromActions: ({ id }: any) => <div>FromActions {id}</div>,
}));
jest.mock("../../lib/components/TransferToActions", () => ({
  TransferToActions: ({ id }: any) => <div>ToActions {id}</div>,
}));
jest.mock("../../lib/components/DirectorActions", () => ({
  DirectorActions: ({ id }: any) => <div>DirectorActions {id}</div>,
}));
jest.mock("../../lib/components/AnalystActions", () => ({
  AnalystActions: ({ id }: any) => <div>AnalystActions {id}</div>,
}));

describe("credit-transfer [id] page", () => {
  const baseTransfer = {
    id: 7,
    status: "SUBMITTED_TO_TRANSFER_TO",
    transferFromId: 1,
    transferToId: 2,
  } as any;

  test("renders correct actions per user role/org", async () => {
    const { getUserInfo } = await import("@/auth");
    const { getTransfer } = await import("../../lib/services");
    (getTransfer as jest.Mock).mockResolvedValue(baseTransfer);

    // transferFrom user
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: false, userOrgId: 1, userRoles: [] });
    render(await Page({ params: Promise.resolve({ id: "7" }) } as any));
    expect(screen.getByText(/FromActions 7/)).toBeInTheDocument();

    // transferTo user
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: false, userOrgId: 2, userRoles: [] });
    render(await Page({ params: Promise.resolve({ id: "7" }) } as any));
    expect(screen.getByText(/ToActions 7/)).toBeInTheDocument();

    // director
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: true, userRoles: ["DIRECTOR"] });
    render(await Page({ params: Promise.resolve({ id: "7" }) } as any));
    expect(screen.getByText(/DirectorActions 7/)).toBeInTheDocument();

    // analyst
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: true, userRoles: ["ENGINEER_ANALYST"] });
    render(await Page({ params: Promise.resolve({ id: "7" }) } as any));
    expect(screen.getByText(/AnalystActions 7/)).toBeInTheDocument();
  });
});

