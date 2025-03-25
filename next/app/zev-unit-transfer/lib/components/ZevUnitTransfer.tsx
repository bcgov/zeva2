import { getZevUnitTransfer } from "../data";

const ZevUnitTransfer = async (props: { id: number }) => {
  const transfer = await getZevUnitTransfer(props.id);
  if (transfer) {
    const transferContent = [];
    for (const content of transfer.zevUnitTransferContent) {
      transferContent.push(
        <div key={content.id}>
          <ul>
            <li key="vehicleClass">Vehicle Class: {content.vehicleClass}</li>
            <li key="zevClass">ZEV Class: {content.zevClass}</li>
            <li key="modelYear">Model Year: {content.modelYear}</li>
            <li key="numberOfUnits">
              Number of units: {content.numberOfUnits.toString()}
            </li>
            <li key="dollarValuePerUnit">
              Dollar value per unit: {content.dollarValuePerUnit.toString()}
            </li>
            <li key="totalDollarValue">
              Total Dollar Value:{" "}
              {content.numberOfUnits
                .times(content.dollarValuePerUnit)
                .toString()}
            </li>
          </ul>
          <br />
        </div>,
      );
    }
    return (
      <div>
        <ul key={-1}>
          <li key="transferFrom">
            Transfer From: {transfer.transferFrom.name}
          </li>
          <li key="transferTo">Transfer To: {transfer.transferTo.name}</li>
          <li key="status">Current Status: {transfer.status}</li>
        </ul>
        <br />
        {transferContent}
      </div>
    );
  }
  return null;
};

export default ZevUnitTransfer;
