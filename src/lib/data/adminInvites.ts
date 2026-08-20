import type { AdminUser } from "./adminUsers";

/**
 * The link in the invitation email.
 *
 * The real product sends this from the backend; here the token is derived from
 * the account id rather than stored, so an invite can be opened from any browser
 * without a table to look it up in. That is the one thing about this flow that
 * is prototype rather than product — everything the screen behind the link does
 * (accepting, declining, what it says you are being granted) is the real
 * sequence.
 *
 * TODO: swap for the signed, expiring token the Admin DB invite contract mints.
 * Nothing outside this module builds or reads a token, so that is a change here
 * and nowhere else.
 */
export function inviteToken(user: AdminUser): string {
  return user.id;
}

export function inviteHref(user: AdminUser): string {
  return `/invite/${encodeURIComponent(inviteToken(user))}`;
}

/** Absolute, because this is the thing that gets pasted into an email. */
export function inviteUrl(user: AdminUser, origin: string): string {
  return `${origin}${inviteHref(user)}`;
}

export function findInvite(users: AdminUser[], token: string): AdminUser | null {
  return users.find((user) => inviteToken(user) === token) ?? null;
}
