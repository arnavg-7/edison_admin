/**
 * Roles of people managed *in* Edison, which is a different concept from Admin
 * access. v2 collapses Admin access to a single Super Admin role, but the user
 * directory still records what each person is.
 *
 * TODO: reconcile against the real role list once IAM/SSO exists.
 */
export type UserRole = "super_admin" | "school_leader" | "faculty" | "support_staff";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  school_leader: "School Leader",
  faculty: "Faculty",
  support_staff: "Support Staff"
};

export const USER_ROLE_ORDER: UserRole[] = [
  "super_admin",
  "school_leader",
  "faculty",
  "support_staff"
];
