import type { MonitoringSnapshot, Period } from '../types/monitoring';

// Replace this adapter with an HTTP request when the backend contract is defined.
// No sample services, inferred measurements or synthetic collection timestamps.
export async function getMonitoringSnapshot(period: Period): Promise<MonitoringSnapshot> {
  void period; // Period will be sent to the backend once the HTTP adapter is implemented.
  return {
    services: [],
    history: [],
    totalEnergyKwh: null,
    totalEmissionsG: null,
    lastCollectionAt: null,
  };
}
