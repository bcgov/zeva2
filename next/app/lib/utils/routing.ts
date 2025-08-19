import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

export const revalidateAndRedirect = (
  path: string,
  redirectType?: RedirectType,
) => {
  revalidatePath(path);
  redirect(path, redirectType);
};
