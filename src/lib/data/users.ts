import type { UserRole } from "./userRoles";

// TODO: replace with the real Admin DB user/provisioning contract.

export type UserSummary = {
  totalUsers: number;
  byRole: { role: UserRole; count: number }[];
  pendingProvisioning: number;
  recentAccessChanges: number;
  asOf: string;
};

export const userSummary: UserSummary = {
  totalUsers: 14208,
  byRole: [
    { role: "school_leader", count: 18 },
    { role: "super_admin", count: 6 },
    { role: "support_staff", count: 4 },
    { role: "faculty", count: 96 }
  ],
  pendingProvisioning: 7,
  recentAccessChanges: 3,
  asOf: "2026-07-17T13:02:00-04:00"
};
