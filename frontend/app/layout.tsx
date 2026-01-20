import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalSidebar from "@/components/ConditionalSidebar";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PocketFlow - Personal Budget Tracker",
  description: "A modern personal finance management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full m-0 p-0`}>
        <AuthProvider>
          <div className="flex h-full bg-gray-50">
            <ConditionalSidebar />
            <main className="flex-1 overflow-y-scroll">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
