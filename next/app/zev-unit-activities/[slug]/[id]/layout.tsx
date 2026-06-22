import { IndividualNavbar } from "@/app/zev-unit-activities/lib/credit-applications/components/IndividualNavbar";
import { CreditTransferNavbar } from "@/app/zev-unit-activities/lib/credit-transfers/components/CreditTransferNavbar";

const Layout = async (props: {
  children: React.ReactNode;
  params: Promise<{ slug: string; id: string }>;
}) => {
  const { slug, id } = await props.params;

  if (slug === "credit-applications") {
    return (
      <>
        <IndividualNavbar creditApplicationId={id} />
        {props.children}
      </>
    );
  }

  if (slug === "credit-transfers") {
    return (
      <>
        <CreditTransferNavbar creditTransferId={id} />
        {props.children}
      </>
    );
  }

  return <>{props.children}</>;
};

export default Layout;
