"use client";

import { Button } from "@/app/lib/components";
import { LoadingSkeleton } from "@/app/lib/components/skeletons";
import { JSX, useCallback, useMemo, useState } from "react";

const ZevUnitTransferActionsClient = (props: {
  commentActionsMap: {
    [key: string]: (comment: string) => Promise<void>;
  };
  noCommentActionsMap: {
    [key: string]: () => Promise<void>;
  };
}) => {
  const [actionPending, setActionPending] = useState<boolean>(false);
  const [comment, setComment] = useState<string>("");

  const handleCommentChange = useCallback((comment: string) => {
    setComment(comment);
  }, []);

  const commentInputVisible = useMemo(() => {
    if (Object.keys(props.commentActionsMap).length > 0) {
      return true;
    }
    return false;
  }, [props.commentActionsMap]);

  const wrappedCommentActionsMap = useMemo(() => {
    const result: { [key: string]: () => Promise<void> } = {};
    for (const [name, action] of Object.entries(props.commentActionsMap)) {
      result[name] = async () => {
        if (comment) {
          setActionPending(true);
          try {
            await action(comment);
          } catch (e) {
            setActionPending(false);
          }
        }
      };
    }
    return result;
  }, [props.commentActionsMap, comment]);

  const wrappedNoCommentActionsMap = useMemo(() => {
    const result: { [key: string]: () => Promise<void> } = {};
    for (const [name, action] of Object.entries(props.noCommentActionsMap)) {
      result[name] = async () => {
        setActionPending(true);
        try {
          await action();
        } catch (e) {
          setActionPending(false);
        }
      };
    }
    return result;
  }, [props.noCommentActionsMap]);

  const actionsJSX = useMemo(() => {
    const result: JSX.Element[] = [];
    for (const [name, action] of Object.entries({
      ...wrappedCommentActionsMap,
      ...wrappedNoCommentActionsMap,
    })) {
      result.push(
        <Button key={name} onClick={action}>
          {name}
        </Button>,
      );
    }
    return result;
  }, [wrappedCommentActionsMap, wrappedNoCommentActionsMap]);

  return (
    <>
      {actionPending ? (
        <LoadingSkeleton />
      ) : (
        <div>
          {commentInputVisible && (
            <input
              className="border-2 border-solid"
              placeholder="comment"
              value={comment}
              onChange={(event) => {
                handleCommentChange(event.target.value);
              }}
            />
          )}
          {actionsJSX}
        </div>
      )}
    </>
  );
};

export default ZevUnitTransferActionsClient;
