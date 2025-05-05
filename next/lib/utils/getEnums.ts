import { Idp, Role, ModelYear } from "@/prisma/generated/client";

export const getIdpEnum = (idpName?: string) => {
  for (const idp of Object.keys(Idp)) {
    const name = idp.toLowerCase().replaceAll("_", "");
    if (name === idpName) {
      return Idp[idp as keyof typeof Idp];
    }
  }
  return undefined;
};

export const getModelYearEnum = (modelYear?: string | number) => {
  if (modelYear) {
    return ModelYear[("MY_" + modelYear) as keyof typeof ModelYear];
  }
  return undefined;
};

export const getRoleEnum = (role?: string) => {
  if (role) {
    return Role[
      role
        .toUpperCase()
        .replaceAll(" ", "_")
        .replaceAll("/", "_") as keyof typeof Role
    ];
  }
  return undefined;
};

// for filtering
export const getEnumOr = (
  key: string,
  matches: string[],
  isEnum: (s: string) => boolean,
) => {
  const result: any[] = [];
  if (matches.length > 0) {
    for (const match of matches) {
      if (isEnum(match)) {
        result.push({ [key]: match });
      }
    }
  } else {
    result.push({ id: -1 });
  }
  return result;
};
