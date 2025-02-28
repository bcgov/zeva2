import { Role } from "@/prisma/generated/client";

declare module "@auth/core/types" {
  interface User {
    idToken?: string;
    roles?: Role[];
    isGovernment?: Boolean;
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
    roles?: Role[];
    isGovernment?: Boolean;
    organizationId?: number;
  }
}
