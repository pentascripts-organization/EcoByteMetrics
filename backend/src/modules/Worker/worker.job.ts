// src/modules/workers/cron-job.ts
import {refreshDiscoveredServices,refreshServiceMetrics} from "../Services/services.service";
import { runWorker} from './worker';
import cron from 'node-cron';

// Configura para rodar a cada 60 segundos
export function start() {
    return cron.schedule('*/1 * * * *', () => {
    runWorker();
  });
}

export async function refreshAllData(): Promise<void> {
  // Primeiro atualiza a lista de serviços.
  await refreshDiscoveredServices();

  // Depois consulta as métricas da lista atualizada.
  await refreshServiceMetrics();
}

 

