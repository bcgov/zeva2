import { getSuppliers } from "../data";
import { OrganizationTable } from "./OrganizationTable";

export const OrganizationList = async (props: { canCreateNewOrg: boolean }) => {
  const organizations = await getSuppliers();
  return (
    <OrganizationTable
      organizations={organizations}
      canCreateNewOrg={props.canCreateNewOrg}
    />
  );
};
