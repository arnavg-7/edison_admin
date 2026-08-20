import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/theme.css";
import "../styles/pages/admin.css";
import { AppShell } from "@/components/shell/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UsersProvider } from "@/lib/users-store";
import { AdminUsersProvider } from "@/lib/admin-users-store";
import { SchoolSetupProvider } from "@/lib/school-setup-store";
import { PoagProvider } from "@/lib/poag-store";
import { AdminScopeProvider } from "@/lib/admin-scope";
import { RoleAccessProvider } from "@/lib/role-access-store";
import { cn } from "@/lib/utils";

/** The app's only typeface. `--font-inter` feeds Tailwind's font-sans/font-mono
 *  in globals.css, so utilities and plain CSS both resolve to Inter. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Edison360 Admin",
  description: "Edison 360 Super Admin portal"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>
        <TooltipProvider>
          <UsersProvider>
            <AdminUsersProvider>
              <RoleAccessProvider>
                <AdminScopeProvider>
                  <SchoolSetupProvider>
                    <PoagProvider>
                      <a className="sf-skip-link" href="#main-content">
                        Skip to main content
                      </a>
                      <AppShell>{children}</AppShell>
                    </PoagProvider>
                  </SchoolSetupProvider>
                </AdminScopeProvider>
              </RoleAccessProvider>
            </AdminUsersProvider>
          </UsersProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
