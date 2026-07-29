export const getNormalizedComment = (comment: string) => {
  const trimmedComment = comment.trim();
  if (trimmedComment === "") {
    return undefined;
  }
  return trimmedComment;
};
