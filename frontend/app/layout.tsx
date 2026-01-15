import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketFlow - Finance Management",
  description: "Personal budget tracker and finance management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-16">
            <Header />
            <main className="mt-16 p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
