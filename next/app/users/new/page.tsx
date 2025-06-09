import { auth } from "@/auth";
import { NewUserForm } from "../lib/components/NewUserForm";

export default async function NewUserPage() {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  const isGovernment = session?.user?.isGovernment;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New User</h1>
      <NewUserForm organizationId={organizationId} isGovernment={isGovernment} />
    </div>
  );
}
