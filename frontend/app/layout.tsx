import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalSidebar from "@/components/ConditionalSidebar";
import ConditionalAISidebar from "@/components/ConditionalAISidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { MonthProvider } from "@/contexts/MonthContext";
import { AISidebarProvider } from "@/contexts/AISidebarContext";
import { BudgetDraftProvider } from "@/contexts/BudgetDraftContext";

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
          <MonthProvider>
            <BudgetDraftProvider>
              <AISidebarProvider>
                <div className="flex h-full bg-gray-50">
                  <ConditionalSidebar />
                  <main className="flex-1 overflow-y-scroll transition-all duration-300 ease-in-out">
                    {children}
                  </main>
                  <ConditionalAISidebar />
                </div>
              </AISidebarProvider>
            </BudgetDraftProvider>
          </MonthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
