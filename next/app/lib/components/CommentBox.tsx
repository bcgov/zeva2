"use client";

import { Dispatch, SetStateAction } from "react";

export const CommentBox = (props: {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  subtext?: string;
}) => {
  return (
    <div className="flex items-start self-stretch gap-6 shadow-[0_2px_4px_0_rgba(0,0,0,0.08)]">
      <div className="flex flex-[1_0_0] flex-col items-start rounded border border-dividerMedium">
        <div className="flex flex-col items-start self-stretch gap-1 rounded-t bg-disabledSurface px-5 py-4">
          <div className="self-stretch text-black text-xl font-bold leading-7">
            {`Comment (${props.subtext ? props.subtext : "optional"})`}
          </div>
        </div>
        <div className="flex flex-col items-start gap-5 self-stretch p-5 shadow-[0_4px_20px_0_rgba(177,177,177,0.10)]">
          <textarea
            value={props.comment}
            onChange={(e) => props.setComment(e.target.value)}
            placeholder="Enter a comment..."
            rows={5}
            className="w-full rounded border border-gray-300 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
