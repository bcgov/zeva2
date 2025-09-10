import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreditTransferForm } from "../CreditTransferForm";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/app/lib/components", () => ({ Button: (props: any) => <button {...props} /> }));
jest.mock("@/app/lib/components/inputs/CommentBox", () => ({ CommentBox: ({ comment, setComment, disabled }: any) => (
  <textarea aria-label="comment" value={comment} onChange={(e) => setComment(e.target.value)} disabled={disabled} />
) }));
jest.mock("@/app/credit-application/lib/utils", () => ({ getNormalizedComment: (s: string) => s.trim() }));
jest.mock("../../utilsClient", () => ({ getCreditTransferPayload: jest.fn((to: string, lines: any[]) => ({ transferToId: Number(to), transferContent: lines })) }));
jest.mock("../../actions", () => ({ submitTransfer: jest.fn().mockResolvedValue({ responseType: "success", message: "ok", data: 99 }) }));

describe("CreditTransferForm", () => {
  test("adds line and submits successfully", async () => {
    // polyfill crypto.randomUUID for JSDOM
    // polyfill crypto.randomUUID
    Object.defineProperty(global, "crypto", { value: { randomUUID: () => "test-id" } });
    render(<CreditTransferForm transferCandidatesMap={{ 2: "Acme" }} currentYear={"MY_2024" as any} />);
    fireEvent.click(screen.getByText(/Add Line/));
    fireEvent.change(screen.getByLabelText(/Transfer To:/).closest("div")!.querySelector("select")!, { target: { value: "2" } });
    fireEvent.click(screen.getByText(/Submit to Transfer Partner/));
    await waitFor(() => expect(require("../../actions").submitTransfer).toHaveBeenCalled());
  });
});
