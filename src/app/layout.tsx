import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/pages/admin.css";

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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
