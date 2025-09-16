import { AgreementUserAction } from "@/prisma/generated/client";
import { enumToTitleString } from "@/lib/utils/convertEnums";
import { AgreementHistoryType } from "../services";
import { Button } from "@/app/lib/components";
import { useState } from "react";
import { CommentBox } from "@/app/lib/components/inputs/CommentBox";

export const AgreementHistories = (props: {
  className?: string;
  agreementHistory: AgreementHistoryType[];
  handleAddComment: (comment: string) => Promise<AgreementHistoryType | null>;
}) => {
  const [histories, setHistories] = useState<AgreementHistoryType[]>(
    props.agreementHistory,
  );
  const [newComment, setNewComment] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  return (
    <div className={props.className}>
      {histories.map((history) => {
        const userName = `${history.user.firstName} ${history.user.lastName}`;
        return history.userAction ===
          AgreementUserAction.ADDED_COMMENT_GOV_INTERNAL ? (
          <div key={`history-${history.id}`}>
            <span className="font-semibold">Comment</span>
            {` by ${userName} [${history.timestamp.toLocaleString()}]`}
            {history.agreementComment?.comment
              .split("\n")
              .map((paragraph, index) => (
                <p
                  key={`history-${history.id}-line-${index}`}
                  className="pl-4 text-primaryBlue"
                >
                  {paragraph}
                </p>
              ))}
          </div>
        ) : (
          <div key={`history-${history.id}`}>
            <span className="font-semibold">
              {enumToTitleString(history.userAction)}
            </span>
            {` by ${userName} [${history.timestamp.toLocaleString()}]`}
          </div>
        );
      })}

      <CommentBox
        comment={newComment}
        setComment={setNewComment}
        disabled={isProcessing}
      />

      {!isProcessing && (
        <Button
          className="mt-2 px-2"
          disabled={newComment.trim().length === 0}
          onClick={async () => {
            setErrorMessage(undefined);
            setIsProcessing(true);
            const createdHistory = await props.handleAddComment(
              newComment.trim(),
            );
            setIsProcessing(false);
            if (createdHistory) {
              setHistories([...histories, createdHistory]);
              setNewComment("");
            } else {
              setErrorMessage("Failed to add comment");
            }
          }}
        >
          Add Comment
        </Button>
      )}

      {isProcessing && <span>Adding comment...</span>}
      {errorMessage && <span className="text-red-500">{errorMessage}</span>}
    </div>
  );
};
