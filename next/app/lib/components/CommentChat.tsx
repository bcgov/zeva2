"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { ChatComment } from "../constants/chatComment";
import {
  DataOrErrorActionResponse,
  ErrorOrSuccessActionResponse,
} from "../utils/actionResponse";
import { getNormalizedComment } from "../utils/comment";
import { Button } from "./inputs";

export const CommentChat = (props: {
  objectId: number;
  editable: boolean;
  userId: number;
  getComments: (
    objectId: number,
  ) => Promise<DataOrErrorActionResponse<ChatComment[]>>;
  addComment: (
    objectId: number,
    comment: string,
  ) => Promise<ErrorOrSuccessActionResponse>;
  editOrDeleteComment: (
    commentId: number,
    type: "edit" | "delete",
    comment?: string,
  ) => Promise<ErrorOrSuccessActionResponse>;
}) => {
  const [isPending, startTransition] = useTransition();
  const [activeComment, setActiveComment] = useState<string>("");
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [error, setError] = useState<string>("");
  const [counter, setCounter] = useState<number>(0);
  // -1 for nothing, 0 for adding, any other number is id of comment being edited
  const [current, setCurrent] = useState<number>(-1);

  useEffect(() => {
    const getComments = async () => {
      const response = await props.getComments(props.objectId);
      if (response.responseType === "data") {
        setComments(response.data);
        setActiveComment("");
        setCurrent(-1);
        setError("");
      }
    };
    getComments();
  }, [props.objectId, counter]);

  const handleAdd = useCallback(() => {
    startTransition(async () => {
      const comment = getNormalizedComment(activeComment);
      if (comment) {
        const response = await props.addComment(props.objectId, comment);
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          setCounter((prev) => prev + 1);
        }
      } else {
        setError("Comment required!");
      }
    });
  }, [props.objectId, props.addComment, activeComment]);

  const handleEdit = useCallback(
    (commentId: number) => {
      startTransition(async () => {
        const comment = getNormalizedComment(activeComment);
        if (comment) {
          const response = await props.editOrDeleteComment(
            commentId,
            "edit",
            comment,
          );
          if (response.responseType === "error") {
            setError(response.message);
          } else {
            setCounter((prev) => prev + 1);
          }
        } else {
          setError("Comment required!");
        }
      });
    },
    [props.objectId, props.addComment, activeComment],
  );

  const handleDelete = useCallback(
    (commentId: number) => {
      startTransition(async () => {
        const response = await props.editOrDeleteComment(commentId, "delete");
        if (response.responseType === "error") {
          setError(response.message);
        } else {
          setCounter((prev) => prev + 1);
        }
      });
    },
    [props.objectId, props.addComment, activeComment],
  );

  const handleCancel = useCallback(() => {
    setError("");
    setCurrent(-1);
    setActiveComment("");
  }, []);

  return (
    <div className="flex flex-col border border-dividerMedium rounded">
      <div className="px-5 py-4 bg-disabledSurface font-bold text-xl">
        Analyst Comments
      </div>
      <div className="flex flex-col p-5 gap-5">
        {comments.length === 0 && (
          <div className="text-sm text-gray-500">No Comments</div>
        )}
        {comments.map((comment, index) => {
          return (
            <Fragment key={comment.id}>
              <div className="flex flex-row">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="font-bold text-sm">
                    Comment {index + 1}: {comment.name}; {comment.timestamp}
                  </div>
                  {current === comment.id ? (
                    <div className="w-1/2 flex flex-col gap-4">
                      <textarea
                        value={activeComment}
                        onChange={(e) => setActiveComment(e.target.value)}
                        placeholder="Enter a comment"
                        rows={5}
                        className="rounded border border-dividerMedium px-4 py-3"
                      />
                      <div className="flex flex-row items-center justify-between">
                        <Button
                          variant="secondary"
                          onClick={handleCancel}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                        <div className="flex flex-row items-center gap-3">
                          {error && <div className="text-red-600">{error}</div>}
                          <Button
                            variant="secondary"
                            onClick={() => handleEdit(comment.id)}
                            disabled={isPending}
                          >
                            Update Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{comment.comment}</div>
                  )}
                </div>
                {current === -1 &&
                  props.editable &&
                  props.userId === comment.userId && (
                    <div className="flex flex-row gap-3">
                      {error && <div className="text-red-600">{error}</div>}
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isPending}
                      >
                        Delete Comment
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setActiveComment(comment.comment);
                          setCurrent(comment.id);
                        }}
                        disabled={isPending}
                      >
                        Edit Comment
                      </Button>
                    </div>
                  )}
              </div>
              <hr className="border-disabledBG"></hr>
            </Fragment>
          );
        })}
        {current === 0 && (
          <div className="w-1/2 flex flex-col gap-4">
            <textarea
              value={activeComment}
              onChange={(e) => setActiveComment(e.target.value)}
              placeholder="Enter a comment"
              rows={5}
              className="rounded border border-dividerMedium px-4 py-3"
            />
            <div className="flex flex-row items-center justify-between">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
              <div className="flex flex-row items-center gap-3">
                {error && <div className="text-red-600">{error}</div>}
                <Button
                  variant="secondary"
                  onClick={handleAdd}
                  disabled={isPending}
                >
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        )}
        {current === -1 && props.editable && (
          <div className="flex flex-row justify-start">
            <Button
              variant="secondary"
              onClick={() => setCurrent(0)}
              disabled={isPending}
            >
              Add a comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
