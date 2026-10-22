import { LowerNavbarWrapper } from "@/app/lib/components/LowerNavbarWrapper";
import { SecondaryNavbar } from "@/app/lib/components/SecondaryNavbar";
import { zevModelTabs } from "../lib/constants";
import { getUserInfo } from "@/auth";
import { Role } from "@/prisma/generated/enums";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov, userRoles } = await getUserInfo();
  let items = [
    {
      label: zevModelTabs["in-progress"].label,
      route: zevModelTabs["in-progress"].route,
    },
    {
      label: zevModelTabs.validated.label,
      route: zevModelTabs.validated.route,
    },
    { label: zevModelTabs.inactive.label, route: zevModelTabs.inactive.route },
  ];
  if (userIsGov) {
    if (userRoles.includes(Role.DIRECTOR)) {
      items = [
        {
          label: zevModelTabs.validated.label,
          route: zevModelTabs.validated.route,
        },
        {
          label: zevModelTabs.inactive.label,
          route: zevModelTabs.inactive.route,
        },
      ];
    } else {
      items = [
        {
          label: zevModelTabs.submitted.label,
          route: zevModelTabs.submitted.route,
        },
        {
          label: zevModelTabs.validated.label,
          route: zevModelTabs.validated.route,
        },
        {
          label: zevModelTabs.inactive.label,
          route: zevModelTabs.inactive.route,
        },
      ];
    }
  }
  const navbar = <SecondaryNavbar items={items} />;
  return (
    <div className="flex flex-col gap-6">
      <LowerNavbarWrapper type="zevModel" navbar={navbar} />
      {props.children}
    </div>
  );
};

export default Layout;
