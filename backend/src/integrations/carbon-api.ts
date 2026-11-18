import { ApiError, CarbonRegion, ListCarbon } from "./api.types";

//Classe de Erro de Api
export class CarbonApiError extends Error implements ApiError {
    constructor(message: string, public readonly statusCode: number, public readonly code: string) {
        super(message);
        this.name = "CarbonApiError";
        this.statusCode=statusCode;
        this.code=code;
         //Object.setPrototypeOf(this, new.target.prototype);
    }
    //verifica se api esta errada
    static apiNull(Api:string | undefined):void{
         if(!Api){
            throw new CarbonApiError(
                "A URL Carbon da API externa não foi configurada.",
                500,
                "API_URL_MISSING"
            )
        }
    }
    //Verifica se tem erro de tempo
    static timeError(error: unknown){
        if(error instanceof  Error &&  error.name === "TimeoutError"){
                throw new CarbonApiError(
                    "A API externa demorou para responder.",
                    504,
                    "EXTERNAL_API_TIMEOUT"
                );
            }
    }
    //Erro do tipo Http
    static httpError(response:Response){
        if(!response.ok){
           throw new CarbonApiError(
            `A API externa respondeu com HTTP ${response.status}.`,
            502,
            "EXTERNAL_API_HTTP_ERROR"
           )
        }
    }
    //verifica se não é lista
    static isNotlist(data:unknown){
        if (!Array.isArray(data)) {
            throw new CarbonApiError(
            "O formato da resposta da API é inválido.",
            502,
            "EXTERNAL_API_INVALID_FORMAT"
            );
        }
    }
    //Validação da estrutura do carbono
    static validarEstrutura(item: unknown): asserts item is CarbonRegion {
        if (
            typeof item !== "object" ||
            item === null ||
            !("code" in item) ||
            !("country" in item) ||
            !("region" in item) ||
            !("city" in item) ||
            !("latitude" in item) ||
            !("longitude" in item) ||
            !("carbon_intensity_gco2e_per_kwh" in item) ||
            !("renewable_share_percent" in item) ||

            typeof item.code !== "string" ||
            item.code.trim() === "" ||

            typeof item.country !== "string" ||
            item.country.trim() === "" ||

            typeof item.region !== "string" ||
            item.region.trim() === "" ||

            typeof item.city !== "string" ||
            item.city.trim() === "" ||

            typeof item.latitude !== "number" ||
            !Number.isFinite(item.latitude) ||
            item.latitude < -90 ||
            item.latitude > 90 ||

            typeof item.longitude !== "number" ||
            !Number.isFinite(item.longitude) ||
            item.longitude < -180 ||
            item.longitude > 180 ||

            typeof item.carbon_intensity_gco2e_per_kwh !== "number" ||
            !Number.isFinite(item.carbon_intensity_gco2e_per_kwh) ||
            item.carbon_intensity_gco2e_per_kwh < 0 ||

            typeof item.renewable_share_percent !== "number" ||
            !Number.isFinite(item.renewable_share_percent) ||
            item.renewable_share_percent < 0 ||
            item.renewable_share_percent > 100
            ) {
            throw new CarbonApiError(
                "A API retornou dados incompletos ou inválidos.",
                502,
                "EXTERNAL_API_INVALID_DATA"
            );
            }
    }
    //Validação da estrutura da lista
    static validarEstruturaLista(data: unknown): asserts data is ListCarbon {
        if (
            typeof data !== "object" ||
            data === null ||
            !("regions" in data) ||
            !("total" in data) ||
            !Array.isArray(data.regions) ||
            typeof data.total !== "number" ||
            !Number.isSafeInteger(data.total) ||
            data.total < 0
        ) {
            throw new CarbonApiError(
            "A API retornou uma estrutura de dados inválida.",
            502,
            "EXTERNAL_API_INVALID_DATA"
            );
        }
        for (const item of data.regions) {
            this.validarEstrutura(item);
        }
        const codes = data.regions.map((region) => region.code);

        if (new Set(codes).size !== codes.length) {
            throw new CarbonApiError(
                "A API retornou códigos de regiões duplicados.",
                502,
                "EXTERNAL_API_INVALID_DATA"
            );
        }
    } 
}

export interface CarbonRegionFactor {
  code: string;
  carbonIntensity: number;
}

type CarbonFactorFetcher = () => Promise<CarbonRegionFactor[]>;

/**
 * Consulta todas as regiões da API de carbono.
 * Centraliza a comunicação HTTP e a validação dos dados.
 */
export async function fetchCarbonRegionList(): Promise<ListCarbon> {
  const carbonApiUrl = process.env.API_CARBON;

  if (!carbonApiUrl) {
    CarbonApiError.apiNull(carbonApiUrl);

    throw new CarbonApiError(
      "A URL da API de carbono não foi configurada.",
      500,
      "API_URL_MISSING",
    );
  }

  const baseUrl = carbonApiUrl.replace(/\/+$/, "");

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/regions`, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error: unknown) {
    CarbonApiError.timeError(error);

    throw new CarbonApiError(
      "Não foi possível conectar à API externa.",
      503,
      "EXTERNAL_API_UNAVAILABLE",
    );
  }

  CarbonApiError.httpError(response);

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new CarbonApiError(
      "A API externa retornou um JSON inválido ou vazio.",
      502,
      "EXTERNAL_API_INVALID_JSON",
    );
  }

  CarbonApiError.validarEstruturaLista(data);

  return data;
}

/**
 * Retorna somente os fatores necessários ao módulo Services.
 */
export async function fetchCarbonRegions(): Promise<CarbonRegionFactor[]> {
  const data = await fetchCarbonRegionList();

  return data.regions.map(region => ({
    code: region.code,
    carbonIntensity: region.carbon_intensity_gco2e_per_kwh,
  }));
}

let carbonFactors = new Map<string, number>();

let fetchFactors: CarbonFactorFetcher = fetchCarbonRegions;

export async function refreshCarbonRegionFactors(): Promise<void> {
  setCarbonRegionFactors(await fetchFactors());
}

export function setCarbonRegionFactors(
  factors: CarbonRegionFactor[],
): void {
  carbonFactors = new Map(
    factors.map(factor => [
      factor.code,
      factor.carbonIntensity,
    ]),
  );
}

export function getCarbonIntensity(
  regionCode: string,
): number | undefined {
  return carbonFactors.get(regionCode);
}

export function setCarbonFactorsFetcherForTesting(
  fetcher: CarbonFactorFetcher,
): void {
  fetchFactors = fetcher;
}

export function resetCarbonFactorsForTesting(): void {
  fetchFactors = fetchCarbonRegions;
  carbonFactors.clear();
}