import { Role } from "@/prisma/generated/client";

declare module "@auth/core/types" {
  interface User {
    internalId?: number;
    idToken?: string;
    roles?: Role[];
    isGovernment?: boolean;
    organizationId?: number;
  }
}

declare module "@auth/core/types" {
  interface Profile {
    identity_provider?: string;
    bceid_username?: string;
    idir_username?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    idToken?: string;
    internalId?: number;
    roles?: Role[];
    isGovernment?: boolean;
    organizationId?: number;
  }
}
