"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "../components/dashboard/DashboardLayout";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The root path is the login page, which doesn't need the dashboard layout
  if (pathname === "/") {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
