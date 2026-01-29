import { getUserInfo } from "@/auth";
import { getUser } from "../lib/data";
import { UserForm } from "../lib/components/UserForm";
import { getGovOrgId } from "@/app/organizations/lib/data";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const user = await getUser(id);
  if (!user) {
    return <div>User not found</div>;
  }

  const { userOrgId } = await getUserInfo();
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
