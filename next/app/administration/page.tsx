import { getUserInfo } from "@/auth";
import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";

const Page = async () => {
  const { userIsGov } = await getUserInfo();
  if (userIsGov) {
    return null;
  }
  redirect(`${Routes.Administration}/supplier-info`);
};

export default Page;
