import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/pages/admin.css";
import { RoleProvider } from "@/lib/role/RoleContext";
import { Sidebar } from "@/components/shell/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Edison Admin",
  description: "Edison360 admin portal"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RoleProvider>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <div className="admin-shell">
            <Sidebar />
            <div id="main-content" className="admin-content-root">
              {children}
            </div>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
