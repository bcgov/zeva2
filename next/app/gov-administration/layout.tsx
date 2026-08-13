import { getUserInfo } from "@/auth";
import { NavigationGuardProvider } from "next-navigation-guard";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  return <NavigationGuardProvider>{props.children}</NavigationGuardProvider>;
};

export default Layout;
