import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "../page";

jest.mock("@/auth", () => ({
  getUserInfo: jest.fn().mockResolvedValue({ userIsGov: false }),
}));

jest.mock("../../lib/utils/nextPage", () => ({
  getPageParams: jest
    .fn()
    .mockImplementation((searchParams: any, defaultPage: number, defaultSize: number) => ({
      page: defaultPage,
      pageSize: defaultSize,
      filters: {},
      sorts: {},
    })),
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ href, children }: any) =>
      React.createElement("a", { href: typeof href === "string" ? href : "#" }, children),
  };
});

jest.mock("../../lib/components", () => {
  const React = require("react");
  return {
    Button: ({ children }: any) => React.createElement("button", null, children),
  };
});

jest.mock("../../lib/constants", () => ({
  Routes: { CreditTransfers: "/credit-transfer" },
}));

jest.mock("../lib/components/CreditTransferList", () => {
  const React = require("react");
  return {
    CreditTransferList: (props: any) =>
      React.createElement("div", {
        "data-testid": "credit-transfer-list",
        "data-props": JSON.stringify(props),
      }),
  };
});

jest.mock("../../lib/components/skeletons", () => {
  const React = require("react");
  return {
    LoadingSkeleton: () => React.createElement("div", null, "Loading..."),
  };
});

describe("credit-transfer Page", () => {
  test("shows submit button for non-gov users and passes params to list", async () => {
    const ui = await Page({ searchParams: Promise.resolve({}) } as any);
    render(ui);

    // Button rendered
    expect(
      screen.getByRole("button", { name: /submit a credit transfer/i }),
    ).toBeInTheDocument();

    // Link wraps the button
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/credit-transfer/new");

    // CreditTransferList received defaulted params
    const list = screen.getByTestId("credit-transfer-list");
    const props = JSON.parse(list.getAttribute("data-props") || "{}");
    expect(props).toMatchObject({ page: 1, pageSize: 10, filters: {}, sorts: {} });
  });

  test("hides submit button for gov users", async () => {
    const { getUserInfo } = await import("@/auth");
    (getUserInfo as jest.Mock).mockResolvedValueOnce({ userIsGov: true });
    const ui = await Page({ searchParams: Promise.resolve({}) } as any);
    render(ui);
    expect(
      screen.queryByRole("button", { name: /submit a credit transfer/i }),
    ).not.toBeInTheDocument();
  });
});
