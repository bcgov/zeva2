import { getZevUnitTransferComments } from "../data";

const ZevUnitTransferComments = async (props: { id: number }) => {
  const comments = await getZevUnitTransferComments(props.id);
  if (comments.length > 0) {
    const entries = [];
    for (const comment of comments) {
      entries.push(
        <div key={comment.id}>
          <div>
            User {comment.user.idpUsername} at{" "}
            {comment.updateTimestamp.toString()} made the comment:{" "}
            {comment.comment}
          </div>
          <br />
        </div>,
      );
    }
    return <div>{entries}</div>;
  }
  return null;
};

export default ZevUnitTransferComments;
