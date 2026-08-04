"use client";

import Link from "next/link";
import type { PersonKind } from "@/lib/data/people";
import { useUsers } from "@/lib/users-store";
import { useMounted } from "@/lib/use-mounted";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProfileShell } from "./ProfileShell";

/**
 * Resolves a profile from the client store, which holds both the seeded records
 * and any the admin created. Client-side because a just-created user exists
 * only in the browser until the Admin DB contract lands — a server lookup would
 * 404 the profile the admin was just redirected to.
 */
export function ProfileResolver({ kind, id }: { kind: PersonKind; id: string }) {
  const { findUser, isLoaded } = useUsers();
  const mounted = useMounted();
  const person = findUser(kind, id);

  // `mounted` as well as `isLoaded`: the provider can load storage before this
  // component hydrates, and rendering a resolved profile against the server's
  // loading state would be a hydration mismatch. See useMounted.
  if (mounted && person) {
    return <ProfileShell person={person} />;
  }

  // Storage hasn't been read yet — don't claim "not found" before we know.
  if (!mounted || !isLoaded) {
    return (
      <section className="sf-main">
        <p className="sf-page-sub">Loading profile…</p>
      </section>
    );
  }

  return (
    <section className="sf-main">
      <EmptyState
        title="Profile not found"
        message="This user doesn't exist, or was created in a different browser."
      />
      <Link className="sf-inline-link" href="/people">
        Back to User Management →
      </Link>
    </section>
  );
}
