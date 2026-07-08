export const ReadonlyCommentBox = (props: {
  comment: string;
  title?: string;
}) => {
  return (
    <div className="border border-dividerMedium rounded">
      <div className="px-5 py-4 bg-disabledBG font-bold text-xl">
        {props.title ? props.title : "Comment (optional)"}
      </div>
      <div className="p-5">{props.comment}</div>
    </div>
  );
};
