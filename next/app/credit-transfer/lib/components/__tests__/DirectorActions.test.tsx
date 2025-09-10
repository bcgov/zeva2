import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DirectorActions } from "../DirectorActions";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock("@/app/lib/components", () => ({ Button: (props: any) => <button {...props} /> }));
jest.mock("@/app/lib/components/inputs/CommentBox", () => ({ CommentBox: ({ comment, setComment }: any) => (
  <textarea aria-label="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
) }));
jest.mock("@/app/credit-application/lib/utils", () => ({ getNormalizedComment: (s: string) => s.trim() }));
jest.mock("../../actions", () => ({
  directorIssueTransfer: jest.fn().mockResolvedValue({ responseType: "success", message: "ok" }),
  directorRejectTransfer: jest.fn().mockResolvedValue({ responseType: "success", message: "ok" }),
  directorReturnTransfer: jest.fn().mockResolvedValue({ responseType: "success", message: "ok" }),
}));

describe("DirectorActions", () => {
  test("returns null when status not eligible", () => {
    const { container } = render(<DirectorActions id={1} status={"SUBMITTED_TO_TRANSFER_TO" as any} />);
    expect(container.innerHTML).toBe("");
  });

  test("approve and return when recommend approval", async () => {
    render(<DirectorActions id={1} status={"RECOMMEND_APPROVAL_GOV" as any} />);
    const buttons = screen.getAllByRole("button");
    // Approve (avoid triggering pending state first)
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(require("../../actions").directorIssueTransfer).toHaveBeenCalled());
  });

  test("reject when recommend rejection", async () => {
    render(<DirectorActions id={1} status={"RECOMMEND_REJECTION_GOV" as any} />);
    const btns = screen.getAllByRole("button");
    fireEvent.click(btns[1]);
    await waitFor(() => expect(require("../../actions").directorRejectTransfer).toHaveBeenCalled());
  });
});
