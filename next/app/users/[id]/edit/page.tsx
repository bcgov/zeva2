import { getUserInfo } from "@/auth";
import { getUser } from "../../lib/data";
import { updateUser, UserPayload } from "../../lib/actions";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";
import { UserForm } from "../../lib/components/UserForm";
import { getGovOrgId } from "@/app/organizations/lib/data";

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const args = await props.params;
  const id = parseInt(args.id, 10);
  const user = await getUser(id);
  if (!user) {
    return <div>User not found</div>;
  }

  const { userOrgId, userId } = await getUserInfo();
  const govOrgId = await getGovOrgId();
  const handleSubmit = async (updated: UserPayload) => {
    "use server";
    await updateUser(id, updated);
    if (id === userId) {
      redirect("/signOut");
    } else {
      redirect(`${Routes.Users}/${id}`);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        User organization: {user.organization.name}
      </h1>
      <UserForm
        user={user}
        userOrgId={userOrgId.toString()}
        govOrgId={govOrgId.toString()}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Page;
