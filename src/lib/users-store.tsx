"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  people as seededPeople,
  type Person,
  type PersonKind,
  type ReadOnlyField
} from "@/lib/data/people";

/**
 * The client-side user store.
 *
 * Admin owns these records outright, but there is no Admin DB yet (see
 * PRODUCT.md), so "saved" means persisted to localStorage: created users and
 * field edits both survive a reload, which is what lets the create → open
 * profile → complete it → status flips flow actually work end to end.
 *
 * Seeded records stay in `people` and are never rewritten. Their edits are
 * stored as an overlay keyed by `kind:id`, so the mock module remains the
 * baseline and only the admin's own changes live here.
 *
 * TODO: swap both halves for API calls once the Admin DB contract exists. The
 * shape here is deliberately close to what those endpoints would return.
 */

const STORAGE_KEY = "edison-admin.users.v1";

type FieldSection = "personal" | "academic";

/** Per-person field overrides, e.g. `{ "student:michael-andrew": { personal: { Guardian: "…" } } }`. */
type FieldEdits = Record<string, Partial<Record<FieldSection, Record<string, string>>>>;

type PersistedState = {
  createdUsers: Person[];
  fieldEdits: FieldEdits;
};

const EMPTY_STATE: PersistedState = { createdUsers: [], fieldEdits: {} };

function personKey(kind: PersonKind, id: string) {
  return `${kind}:${id}`;
}

function readStorage(): PersistedState {
  if (typeof window === "undefined") return EMPTY_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      createdUsers: Array.isArray(parsed.createdUsers) ? parsed.createdUsers : [],
      fieldEdits: parsed.fieldEdits && typeof parsed.fieldEdits === "object" ? parsed.fieldEdits : {}
    };
  } catch {
    // Corrupt or unavailable storage shouldn't take the page down — start clean.
    return EMPTY_STATE;
  }
}

/** Apply stored edits over a record's fields, preserving label order. */
function withEdits(person: Person, edits: FieldEdits): Person {
  const forPerson = edits[personKey(person.kind, person.id)];
  if (!forPerson) return person;

  const merge = (fields: ReadOnlyField[], section: FieldSection): ReadOnlyField[] => {
    const patch = forPerson[section];
    if (!patch) return fields;
    return fields.map((field) =>
      field.label in patch ? { ...field, value: patch[field.label] } : field
    );
  };

  return {
    ...person,
    personal: merge(person.personal, "personal"),
    academic: merge(person.academic, "academic")
  };
}

type UsersContextValue = {
  /** Every user, created-first, with field edits applied. */
  users: Person[];
  findUser: (kind: PersonKind, id: string) => Person | undefined;
  createUser: (person: Person) => void;
  createUsers: (people: Person[]) => void;
  setField: (
    kind: PersonKind,
    id: string,
    section: FieldSection,
    label: string,
    value: string
  ) => void;
  /** False until localStorage has been read, so the UI can avoid a false "not found". */
  isLoaded: boolean;
};

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  // Starts empty on both server and first client render so hydration matches;
  // the effect below fills it in from storage immediately after mount.
  const [state, setState] = useState<PersistedState>(EMPTY_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota or private-mode failures are non-fatal; the session still works.
    }
  }, [state, isLoaded]);

  const createUser = useCallback((person: Person) => {
    setState((current) => ({ ...current, createdUsers: [person, ...current.createdUsers] }));
  }, []);

  const createUsers = useCallback((newPeople: Person[]) => {
    setState((current) => ({ ...current, createdUsers: [...newPeople, ...current.createdUsers] }));
  }, []);

  const setField = useCallback(
    (kind: PersonKind, id: string, section: FieldSection, label: string, value: string) => {
      const key = personKey(kind, id);
      setState((current) => ({
        ...current,
        fieldEdits: {
          ...current.fieldEdits,
          [key]: {
            ...current.fieldEdits[key],
            [section]: { ...current.fieldEdits[key]?.[section], [label]: value }
          }
        }
      }));
    },
    []
  );

  const users = useMemo(
    () =>
      [...state.createdUsers, ...seededPeople].map((person) => withEdits(person, state.fieldEdits)),
    [state.createdUsers, state.fieldEdits]
  );

  const findUser = useCallback(
    (kind: PersonKind, id: string) =>
      users.find((person) => person.kind === kind && person.id === id),
    [users]
  );

  const value = useMemo(
    () => ({ users, findUser, createUser, createUsers, setField, isLoaded }),
    [users, findUser, createUser, createUsers, setField, isLoaded]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers(): UsersContextValue {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers must be used inside <UsersProvider>");
  }
  return context;
}
