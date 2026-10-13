"use client";

import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dispatch, SetStateAction } from "react";

export const CommentBox = (props: {
  comment: string;
  setComment: Dispatch<SetStateAction<string>>;
  subtext?: string;
  warningSubSentence?: string;
}) => {
  return (
    <div className="border border-dividerMedium rounded">
      <div className="flex flex-col gap-1 px-5 py-4 bg-disabledBG">
        <div className="font-bold text-xl">
          Comment ({props.subtext ? props.subtext : "optional"})
        </div>
        {props.warningSubSentence && (
          <div className="flex flex-row gap-1">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="text-error mt-1"
            />
            {`This comment will be visible to the supplier organization if you ${props.warningSubSentence}. Therefore, if you ${props.warningSubSentence} with a comment, please ensure the comment does not contain internal or confidential information.`}
          </div>
        )}
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
