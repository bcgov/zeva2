import { auth } from "@/auth";
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./lib/components";

export const metadata: Metadata = {
  title: "ZEVA",
  description: "Zero Emission Vehicles Reporting System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session?.user) {
    // Authenticated layout
    return (
      <html lang="en">
        <body className="antialiased h-screen flex flex-col">
          <Header session={session} />
          <main className="flex-1 overflow-auto">{children}</main>
        </body>
      </html>
    );
  } else {
    // Unauthenticated layout
    return (
      <html lang="en">
        <body className="antialiased h-screen">{children}</body>
      </html>
    );
  }
}
