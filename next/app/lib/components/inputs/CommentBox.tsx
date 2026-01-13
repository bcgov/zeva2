"use client";

import { Dispatch, SetStateAction } from "react";

export const CommentBox = ({
  comment,
  setComment,
  disabled,
  placeholder,
}: {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  disabled: boolean;
  placeholder?: string;
}) => {
  return (
    <textarea
      className="w-full border  p-2"
      rows={3}
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      placeholder={placeholder ?? "Optional Comment"}
      disabled={disabled}
    />
  );
};
