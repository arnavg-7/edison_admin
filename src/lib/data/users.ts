import type { Role } from "@/lib/role/roles";

// TODO: replace with the real Admin DB user/provisioning contract.

export type UserSummary = {
  totalUsers: number;
  byRole: { role: Role; count: number }[];
  pendingProvisioning: number;
  recentAccessChanges: number;
  asOf: string;
};

export const userSummary: UserSummary = {
  totalUsers: 14208,
  byRole: [
    { role: "leadership", count: 18 },
    { role: "portal_admin", count: 6 },
    { role: "it_admin", count: 4 }
  ],
  pendingProvisioning: 7,
  recentAccessChanges: 3,
  asOf: "2026-07-31T13:02:00-04:00"
};
