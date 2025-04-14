import { EmailInput } from "../lib/components/EmailInput";
import { getUser } from "../lib/data";
import { updateEmail } from "../lib/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseInt((await params).id, 10);
  const user = await getUser(id);
  if (user) {
    const onSubmit = updateEmail.bind(
      null,
      user.id,
      user.organizationId,
      "/usersExample",
    );
    return (
      <div>
        <div>User subject identifier: {user.idpSub}</div>
        <div>
          <EmailInput
            initialEmail={user.contactEmail ?? ""}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    );
  }
  return null;
}
