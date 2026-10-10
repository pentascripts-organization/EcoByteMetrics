
import "dotenv/config";

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
