import { notFound } from "next/navigation";
import { people, type PersonKind } from "@/lib/data/people";
import { ProfileResolver } from "@/components/people/ProfileResolver";

/**
 * Seeded profiles are prerendered. Newly created ones can't be — Admin owns
 * them client-side until the Admin DB exists — so `dynamicParams` lets those
 * URLs through and `ProfileResolver` looks them up in the client store.
 */
export function generateStaticParams() {
  return people.map((person) => ({ kind: person.kind, id: person.id }));
}

export const dynamicParams = true;

export default async function PersonProfilePage({
  params
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;

  if (kind !== "student" && kind !== "faculty") {
    notFound();
  }

  return <ProfileResolver kind={kind as PersonKind} id={id} />;
}
