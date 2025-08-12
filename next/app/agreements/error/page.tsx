import { Routes } from "@/app/lib/constants";

const Page = async () => {
  return (
    <div className="p-6">
      <p className="font-semibold mb-4">
        An error occurred while processing your request.
      </p>
      <a
        className="text-defaultLinkBlue hover:underline"
        href={Routes.CreditAgreements}
      >
        Back to the Credit Agreement page
      </a>
    </div>
  );
};

export default Page;
