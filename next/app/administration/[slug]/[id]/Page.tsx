import { getUserInfo } from "@/auth";
import { getUser } from "../../lib/data";
import { UserForm } from "../../lib/components/UserForm";
import { getGovOrgId } from "@/app/vehicle-suppliers/lib/data";

const Page = async (props: { params: Promise<{ slug: string, id: string }> }) => {
  const { userIsGov, userOrgId } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  const args = await props.params;
  const id = Number.parseInt(args.id, 10);
  const user = await getUser(id);
  if (!user) {
    return null;
  }
  const govOrgId = await getGovOrgId();
  return (
    <div className="w-full px-6 py-6 lg:px-10 xl:px-14">
      <UserForm
        user={user}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
      />
    </div>
  );
};

export default Page;
