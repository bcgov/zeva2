"use client";

import React, { Dispatch, SetStateAction } from "react";

export const CommentBox = ({
  comment,
  setComment,
  disabled,
}: {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  disabled: boolean;
}) => {
  return (
    <textarea
      className="w-full min-h-20 p-2 border border-solid border-gray-300 rounded-1 mb-4 resize-y"
      disabled={disabled}
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      placeholder="Optional comment"
    />
  );
};
