"use client";

import { useRole } from "@/lib/role/RoleContext";
import { ROLE_LABELS } from "@/lib/role/roles";
import {
  SETTINGS_SCREENS,
  canAccessSettingsScreen,
  type SettingsScreenId
} from "@/lib/role/systemSettingsAccess";

export function SettingsScreenGuard({
  screen,
  children
}: {
  screen: SettingsScreenId;
  children: React.ReactNode;
}) {
  const { role } = useRole();

  if (canAccessSettingsScreen(role, screen)) {
    return <>{children}</>;
  }

  const owner = SETTINGS_SCREENS.find((item) => item.id === screen)
    ?.roles.map((value) => ROLE_LABELS[value])
    .join(", ");

  return (
    <div className="admin-content-panel">
      <h2>Not available for your role</h2>
      <p>This settings screen is owned by: {owner}.</p>
    </div>
  );
}
