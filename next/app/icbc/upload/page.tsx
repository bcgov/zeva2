import { redirect, RedirectType } from "next/navigation";
import { createIcbcFile, getPutObjectData } from "../lib/actions";
import { Routes } from "@/app/lib/constants";
import { IcbcFileStatus } from "@/prisma/generated/client";
import { Upload } from "../lib/components/Upload";

const Page = async () => {
  const getPutData = async () => {
    "use server";
    return await getPutObjectData();
  };
  const createFile = async (filename: string, datestring: string) => {
    "use server";
    await createIcbcFile({
      name: filename,
      timestamp: new Date(datestring),
      status: IcbcFileStatus.PROCESSING,
    });
    redirect(Routes.Icbc, RedirectType.push);
  };
  return <Upload getPutData={getPutData} createFile={createFile} />;
};

export default Page;
