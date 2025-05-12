import { getVehicleComments } from "../data";

const VehicleComments = async (props: { id: number }) => {
  const comments = await getVehicleComments(props.id);
  if (comments && comments.length > 0) {
    const entries = [];
    for (const each of comments) {
      entries.push(
        <div key={each.id}>
          <div>
            <b>
              {each.createTimestamp &&
                each.createTimestamp.toLocaleString("en-US", {
                  timeZone: "America/Los_Angeles",
                })}{" "}
              {each.createUser}
            </b>
          </div>
          {each.comment && <div>Comment: {each.comment}</div>}
          <br />
        </div>,
      );
    }
    return <div>{entries.reverse()}</div>;
  }
  return null;
};

export default VehicleComments;
