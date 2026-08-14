import { getUserInfo } from "@/auth";

const Layout = async (props: { children: React.ReactNode }) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    return null;
  }
  return <>{props.children}</>;
};

export default Layout;
