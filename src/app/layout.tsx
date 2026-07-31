import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/theme.css";
import "../styles/pages/admin.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { ContextBar } from "@/components/shell/ContextBar";

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
    <html lang="en">
      <body className={inter.className}>
        <a className="sf-skip-link" href="#main-content">
          Skip to main content
        </a>
        <div className="sf-shell">
          <Sidebar />
          <div className="sf-main-region">
            <ContextBar />
            <div id="main-content">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
