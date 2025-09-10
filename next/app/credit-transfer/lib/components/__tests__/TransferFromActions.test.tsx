import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransferFromActions } from "../TransferFromActions";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("@/app/lib/components", () => ({ Button: (props: any) => <button {...props} /> }));
jest.mock("@/app/lib/components/inputs/CommentBox", () => ({ CommentBox: ({ comment, setComment }: any) => (
  <textarea aria-label="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
) }));
jest.mock("@/app/credit-application/lib/utils", () => ({ getNormalizedComment: (s: string) => s.trim() }));
jest.mock("../../constants", () => ({ transferFromSupplierRescindableStatuses: ["SUBMITTED_TO_TRANSFER_TO"] }));
jest.mock("../../actions", () => ({ rescindTransfer: jest.fn().mockResolvedValue({ responseType: "success", message: "ok" }) }));

describe("TransferFromActions", () => {
  test("returns null when status not rescindable", () => {
    const { container } = render(<TransferFromActions id={1} status={"APPROVED_BY_TRANSFER_TO" as any} />);
    expect(container.innerHTML).toBe("");
  });

  test("rescind flows and refreshes", async () => {
    render(<TransferFromActions id={1} status={"SUBMITTED_TO_TRANSFER_TO" as any} />);
    fireEvent.change(screen.getByLabelText("comment"), { target: { value: " c " } });
    fireEvent.click(screen.getByText(/Rescind/));
    await waitFor(() => expect(require("../../actions").rescindTransfer).toHaveBeenCalled());
  });
});

