import { redirect } from "next/navigation";
import { Routes } from "@/app/lib/constants";

const Page = async () => {
  redirect(`${Routes.GovAdministration}/idir`);
};

export default Page;
