import { $Enums } from "@/prisma/generated/client";
import { enumToTitleString } from "@/lib/utils/convertEnums";

type OrganizationAddress = {
  addressLines: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  county: string | null;
  country: string | null;
  representative: string | null;
};

type OrganizationUser = {
  id: number;
  firstName: string;
  lastName: string;
  roles: $Enums.Role[];
};

const formattedAddress = (address: OrganizationAddress | undefined) => {
  if (!address) return <span>N/A</span>;
  const { addressLines, city, state, postalCode, country, representative } =
    address;
  return (
    <div>
      {representative && <p>{representative}</p>}
      {addressLines &&
        addressLines
          .split("\n")
          .map((line, index) => <p key={index}>{line}</p>)}
      {(city || state || postalCode) && (
        <p>
          {city}, {state} {postalCode}
        </p>
      )}
      {country && <p>{country}</p>}
    </div>
  );
};

const organizationUsers = (users: OrganizationUser[]) => {
  if (users.length === 0) {
    return <span>N/A</span>;
  }
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <a
            href={`/users/${user.id}`}
            className="text-primaryBlue hover:underline"
          >
            {user.firstName} {user.lastName} [
            {user.roles.map((role) => enumToTitleString(role)).join(" | ")}]
          </a>
        </li>
      ))}
    </ul>
  );
};

const OrganizationDetails = async (props: {
  organizationName: string;
  firstModelYear: string;
  serviceAddress?: OrganizationAddress;
  recordsAddress?: OrganizationAddress;
  supplierClass: string;
  users: OrganizationUser[];
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-primaryBlue">
        {props.organizationName}
      </h2>
      <div className="flex flex-row mt-2">
        <div className="w-1/3">
          <h3 className="font-semibold">Service Address</h3>
          {formattedAddress(props.serviceAddress)}
        </div>
        <div className="w-1/3">
          <h3 className="font-semibold">Records Address</h3>
          {formattedAddress(props.recordsAddress)}
        </div>
      </div>
      <div className="mt-4">
        <span className="font-semibold mr-2">Vehicle Supplier Class:</span>
        {props.supplierClass}
      </div>
      <div className="mt-4">
        <span className="font-semibold mr-2">First Model Year Report:</span>
        {props.firstModelYear}
      </div>
      <div className="mt-4">
        <h3 className="font-semibold mr-2">User(s):</h3>
        {organizationUsers(props.users)}
      </div>
    </div>
  );
};

export default OrganizationDetails;
