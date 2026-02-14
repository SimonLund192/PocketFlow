"use client";

import { usePathname } from "next/navigation";
import AISidebar from "./AISidebar";

export default function ConditionalAISidebar() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return null;
  }

  return <AISidebar />;
}
