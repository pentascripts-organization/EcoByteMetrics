export interface CarbonRegionFactor {
	code: string;
	carbonIntensity: number;
	renewablePercent: number;
}

const carbonApiUrl = process.env.API_CARBON;

export async function fetchCarbonRegions(): Promise<CarbonRegionFactor[]> {
	if (!carbonApiUrl) {
		throw new Error("A variável API_CARBON não foi configurada no ambiente.");
	}

	const baseUrl = carbonApiUrl.replace(/\/+$/, "");
	const response = await fetch(`${baseUrl}/regions`, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(10000),
	});

	if (!response.ok) {
		throw new Error(`Erro ao consultar regiões de carbono: HTTP ${response.status}`);
	}

	const data: unknown = await response.json();
	if (
		typeof data !== "object" ||
		data === null ||
		!("regions" in data) ||
		!Array.isArray(data.regions)
	) {
		throw new Error("Resposta inválida ao consultar regiões de carbono.");
	}

	return data.regions.flatMap((value): CarbonRegionFactor[] => {
		if (typeof value !== "object" || value === null) return [];
		if (
			!("code" in value) || typeof value.code !== "string" ||
			!("carbon_intensity_gco2e_per_kwh" in value) ||
			typeof value.carbon_intensity_gco2e_per_kwh !== "number" ||
			!Number.isFinite(value.carbon_intensity_gco2e_per_kwh) ||
			value.carbon_intensity_gco2e_per_kwh < 0 ||
			!("renewable_share_percent" in value) ||
			typeof value.renewable_share_percent !== "number" ||
			!Number.isFinite(value.renewable_share_percent) ||
			value.renewable_share_percent < 0 ||
			value.renewable_share_percent > 100
		) {
			return [];
		}

		return [{
			code: value.code,
			carbonIntensity: value.carbon_intensity_gco2e_per_kwh,
			renewablePercent: value.renewable_share_percent,
		}];
	});
}

