"use client";

import React from "react";

export const CommentBox = ({
  comment,
  setComment,
}: {
  comment: string;
  setComment: (val: string) => void;
}) => {
  return (
    <textarea
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      placeholder="Optional comment"
      style={{
        minHeight: "80px",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        resize: "vertical",
        marginBottom: "1rem",
        width: "100%",
      }}
    />
  );
};
