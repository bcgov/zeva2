import {
  getNotificationEnumsToStringsMap,
  getRoleEnumsToStringsMap,
} from "@/app/lib/utils/enumMaps";
import { getUser } from "../data";

export const UserDetails = async (props: { userId: number }) => {
  const user = await getUser(props.userId);
  if (!user) {
    return null;
  }
  const rolesMap = getRoleEnumsToStringsMap();
  const notificationsMap = getNotificationEnumsToStringsMap();
  const roles = user.roles.map((role) => {
    return rolesMap[role];
  });
  const notifications = user.notifications.map((notification) => {
    return notificationsMap[notification];
  });
  return (
    <ul>
      <li key="organization">Organization: {user.organization.name}</li>
      <li key="firstName">First Name: {user.firstName}</li>
      <li key="lastName">Last Name: {user.lastName}</li>
      <li key="isActive">Is Active: {user.isActive ? "True" : "False"}</li>
      <li key="idpUsername">IDP Username: {user.idpUsername}</li>
      <li key="roles">Roles: {roles.join(", ")}</li>
      <li key="notifications">Notifications: {notifications.join(", ")}</li>
    </ul>
  );
};
