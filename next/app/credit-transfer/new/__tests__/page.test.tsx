import React from "react";
import Page from "../page";
import { render, screen } from "@testing-library/react";

jest.mock("@/auth", () => ({ getUserInfo: jest.fn() }));
jest.mock("@/app/lib/data/orgs", () => ({ getOrgsMap: jest.fn(() => ({ 2: "Partner" })) }));
jest.mock("@/app/lib/utils/complianceYear", () => ({ getCurrentComplianceYear: jest.fn(() => "MY_2024") }));
jest.mock("../../lib/components/CreditTransferForm", () => ({
  CreditTransferForm: (props: any) => <div data-testid="form" data-props={JSON.stringify(props)} />,
}));

describe("credit-transfer new page", () => {
  test("returns null for gov users, renders for non-gov", async () => {
    const { getUserInfo } = await import("@/auth");
    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: true, userOrgId: 1 });
    render(await Page());
    expect(screen.queryByTestId("form")).not.toBeInTheDocument();

    (getUserInfo as jest.Mock).mockResolvedValue({ userIsGov: false, userOrgId: 1 });
    render(await Page());
    const el = screen.getByTestId("form");
    const props = JSON.parse(el.getAttribute("data-props") || "{}");
    expect(props.transferCandidatesMap).toEqual({ 2: "Partner" });
    expect(props.currentYear).toBe("MY_2024");
  });
});

