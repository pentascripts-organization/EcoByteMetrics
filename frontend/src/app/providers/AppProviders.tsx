import type { ReactNode } from "react";
import { MonitoringProvider } from "@/features/monitoring/providers/MonitoringProvider";
import { SettingsProvider } from "@/shared/preferences/SettingsProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <MonitoringProvider>{children}</MonitoringProvider>
    </SettingsProvider>
  );
}
