import { getZevUnitTransferHistories } from "../data";

const ZevUnitTransferHistories = async (props: { id: number }) => {
  // const wait = await new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve("resolved");
  //   }, 5000);
  // });
  const histories = await getZevUnitTransferHistories(props.id);
  if (histories.length > 0) {
    const entries = [];
    for (const history of histories) {
      entries.push(
        <div key={history.id}>
          <div>
            {history.user.idpUsername} made the transfer{" "}
            {history.afterUserActionStatus} on {history.timestamp.toString()}
          </div>
          <br />
        </div>,
      );
    }
    return <div>{entries}</div>;
  }
  return null;
};

export default ZevUnitTransferHistories;
