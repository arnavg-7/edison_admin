"use client";

import { use } from "react";
import { AdminUserRecord } from "@/components/admin-users/AdminUserRecord";

/**
 * One admin account: who they are, what they can reach, and what they have done.
 *
 * A route rather than a drawer, matching how the app treats a person elsewhere —
 * a 360 profile is a page. An activity trail is something you read down and link
 * someone to, which a drawer over the list it came from is a poor place for.
 */
export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminUserRecord id={id} />;
}
