import { collectMonitoring, COLLECTION_INTERVAL_MS } from "../Monitoring/collector";

export function start() {
  return setInterval(() => {
    void collectMonitoring().catch(() => console.error("Falha na coleta; os últimos dados gravados foram preservados."));
  }, COLLECTION_INTERVAL_MS);
}

export async function refreshAllData(): Promise<void> {
  await collectMonitoring();
}
