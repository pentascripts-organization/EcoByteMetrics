import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export interface ServiceLocation {
  region_code: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface AggregatorService {
  id: string;
  name: string;
  location: ServiceLocation;
  metrics_path: string;
}

const aggregatorUrl = process.env.API_METRIC;

export async function fetchAvailableServices(): Promise<AggregatorService[]> {
  if (!aggregatorUrl) {
    throw new Error(
      "A variável API_METRIC não foi configurada no ambiente."
    );
  }

  const baseUrl = aggregatorUrl.replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/services`, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao consultar o Agregador: HTTP ${response.status}`
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "Resposta inválida do Agregador: era esperada uma lista."
    );
  }

  for (const [index, item] of data.entries()) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("id" in item) ||
      typeof item.id !== "string" ||
      !("name" in item) ||
      typeof item.name !== "string" ||
      !("location" in item) ||
      typeof item.location !== "object" ||
      item.location === null ||
      !("metrics_path" in item) ||
      typeof item.metrics_path !== "string"
    ) {
      throw new Error(
        `Dados inválidos no serviço da posição ${index}.`
      );
    }
  }

  return data as AggregatorService[];
}

export async function fetchServiceMetrics(serviceId: string): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  if (!aggregatorUrl) {
    throw new Error("A variável API_METRIC não foi configurada.");
  }

  const baseUrl = aggregatorUrl.replace(/\/+$/, "");
  const response = await fetch(
    baseUrl + "/metrics/" + encodeURIComponent(serviceId),
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    }
  );
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Resposta inválida do Agregador de Métricas.");
  }
  const body = data as Record<string, unknown>;
  if (!response.ok) return { status: response.status, body };

  const interval = body.collection_interval_seconds;
  const metrics = body.metrics;
  if (
    typeof interval !== "number" ||
    !Number.isSafeInteger(interval) || interval < 0 ||
    typeof metrics !== "object" || metrics === null || Array.isArray(metrics)
  ) {
    throw Object.assign(new Error("Métricas ou intervalo de coleta inválidos."), { name: "InvalidMetricsError" });
  }
  const values = metrics as Record<string, unknown>;
  for (const key of ["cpu_percent", "memory_gb", "disk_gb", "network_gb"]) {
    const value = values[key];
    if (
      typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
      (key === "cpu_percent" && value > 100)
    ) {
      throw Object.assign(new Error("Métrica ausente ou inválida: " + key + "."), { name: "InvalidMetricsError" });
    }
  }

  return {
    status: 200,
    body: { ...body, collectedAt: new Date().toISOString() },
  };
}
