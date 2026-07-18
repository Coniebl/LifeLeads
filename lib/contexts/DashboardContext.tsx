"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useDashboardData } from "../hooks/useDashboardData";

// Infer the return type of useDashboardData
export type DashboardContextType = ReturnType<typeof useDashboardData>;

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const dashboardData = useDashboardData();

  return (
    <DashboardContext.Provider value={dashboardData}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}
