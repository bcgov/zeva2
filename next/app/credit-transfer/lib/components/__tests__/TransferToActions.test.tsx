import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransferToActions } from "../TransferToActions";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("@/app/lib/components", () => ({ Button: (props: any) => <button {...props} /> }));
jest.mock("@/app/lib/components/inputs/CommentBox", () => ({ CommentBox: ({ comment, setComment }: any) => (
  <textarea aria-label="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
) }));
jest.mock("@/app/credit-application/lib/utils", () => ({ getNormalizedComment: (s: string) => s.trim() }));
jest.mock("../../actions", () => ({ transferToSupplierActionTransfer: jest.fn().mockResolvedValue({ responseType: "success", message: "ok" }) }));

describe("TransferToActions", () => {
  test("returns null when status not SUBMITTED_TO_TRANSFER_TO", () => {
    const { container } = render(<TransferToActions id={1} status={"APPROVED_BY_TRANSFER_TO" as any} />);
    expect(container.innerHTML).toBe("");
  });

  test("approve and reject call action", async () => {
    render(<TransferToActions id={1} status={"SUBMITTED_TO_TRANSFER_TO" as any} />);
    const buttons = screen.getAllByRole("button");
    // first is Approve, second is Reject (labels may be '...' while pending)
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(require("../../actions").transferToSupplierActionTransfer).toHaveBeenCalled());
  });
});
