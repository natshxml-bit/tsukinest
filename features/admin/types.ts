// features/admin/types.ts

import type { UserRole } from "@/lib/userSync";

export interface AdminUserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAtMs: number | null;
  lastActiveMs: number | null;
  online: boolean;
}

export type { UserRole };
