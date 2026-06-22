"use client";

import { Dispatch, SetStateAction } from "react";

export const CommentBox = (props: {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  subtext?: string;
}) => {
  return (
    <div className="border border-gray-300 bg-white rounded mb-4">
      <div className="p-4 bg-disabledBG border-b border-gray-300">
        <h2 className="text-base font-bold text-gray-900">
          {`Comment (${props.subtext ? props.subtext : "optional"})`}
        </h2>
      </div>
      <div className="p-6">
        <textarea
          value={props.comment}
          onChange={(e) => props.setComment(e.target.value)}
          placeholder="Enter a description..."
          rows={5}
          className="w-full max-w-[560px] rounded border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
        />
      </div>
    </div>
  );
};
