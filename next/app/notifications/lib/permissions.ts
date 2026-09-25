import { Role } from "@/prisma/generated/enums";

const notificationAuthorRoles: Role[] = [Role.ZEVA_IDIR_USER, Role.DIRECTOR];

export const canAuthorNotifications = (
  userIsGov: boolean,
  userRoles: Role[],
): boolean =>
  userIsGov && userRoles.some((role) => notificationAuthorRoles.includes(role));
