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
      className="w-full border  p-2"
      rows={3}
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      placeholder="Optional Comment"
      disabled={disabled}
    />
  );
};
