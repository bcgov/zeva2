"use client";

import { Dispatch, SetStateAction } from "react";

export const CommentBox = (props: {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  subtext?: string;
}) => {
  return (
    <div className="border border-dividerMedium rounded">
      <div className="px-5 py-4 bg-disabledBG font-bold text-xl">
        Comment ({props.subtext ? props.subtext : "optional"})
      </div>
      <div className="p-5">
        <textarea
          value={props.comment}
          onChange={(e) => props.setComment(e.target.value)}
          placeholder="Enter a comment"
          rows={5}
          className="w-1/2 rounded border border-dividerMedium px-4 py-3 placeholder:text-disabledIcon"
        />
      </div>
    </div>
  );
};
