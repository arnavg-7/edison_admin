import { notFound } from "next/navigation";
import { findPerson, people, type PersonKind } from "@/lib/data/people";
import { ProfileShell } from "@/components/people/ProfileShell";

export function generateStaticParams() {
  return people.map((person) => ({ kind: person.kind, id: person.id }));
}

export default async function PersonProfilePage({
  params
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;

  if (kind !== "student" && kind !== "faculty") {
    notFound();
  }

  const person = findPerson(kind as PersonKind, id);

  if (!person) {
    notFound();
  }

  return <ProfileShell person={person} />;
}
