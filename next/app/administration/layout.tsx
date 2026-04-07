import { NavigationGuardProvider } from "next-navigation-guard";

const Layout = async (props: { children: React.ReactNode }) => {
  return <NavigationGuardProvider>{props.children}</NavigationGuardProvider>;
};

export default Layout;
