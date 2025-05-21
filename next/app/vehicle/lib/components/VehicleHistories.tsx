import { getVehicleHistories } from "../data";

const VehicleHistories = async (props: { id: number }) => {
  const histories = await getVehicleHistories(props.id);
  if (histories && histories.length > 0) {
    const entries = [];
    for (const each of histories) {
      entries.push(
        <div key={each.id}>
          <div>
            <b>
              {each.validationStatus} {each.createUser}
            </b>
          </div>
          {each.createTimestamp &&
            each.createTimestamp.toLocaleString("en-US", {
              timeZone: "America/Los_Angeles",
            })}{" "}
          <br />
        </div>,
      );
    }
    return <div>{entries.reverse()}</div>;
  }
  return null;
};

export default VehicleHistories;
