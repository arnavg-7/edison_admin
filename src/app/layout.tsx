import type { Metadata } from "next";
import { Inter, Figtree } from "next/font/google";
import "./globals.css";
import "../styles/theme.css";
import "../styles/pages/admin.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { ContextBar } from "@/components/shell/ContextBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UsersProvider } from "@/lib/users-store";
import { AdminUsersProvider } from "@/lib/admin-users-store";
import { cn } from "@/lib/utils";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body className={inter.className}>
        <TooltipProvider>
          <UsersProvider>
            <AdminUsersProvider>
              <a className="sf-skip-link" href="#main-content">
                Skip to main content
              </a>
              <SidebarProvider>
                <Sidebar />
                <SidebarInset className="sf-main-region">
                  <ContextBar />
                  <div id="main-content">{children}</div>
                </SidebarInset>
              </SidebarProvider>
            </AdminUsersProvider>
          </UsersProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
