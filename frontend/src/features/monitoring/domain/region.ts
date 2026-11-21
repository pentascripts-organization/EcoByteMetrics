import type { MonitoredService } from "@/features/monitoring/types";
import { findCountry, localizeCity } from "@/shared/geography/geography";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function matchesRegion(
  service: Pick<MonitoredService, "country" | "city">,
  country: string,
  city: string,
) {
  const placeCountry = service.country ?? "";
  const registeredCountry =
    findCountry(placeCountry)?.properties.code ?? normalize(placeCountry);
  const selectedCountry =
    findCountry(country)?.properties.code ?? normalize(country);
  return (
    (!country || registeredCountry === selectedCountry) &&
    (!city ||
      normalize(localizeCity(placeCountry, service.city) ?? "") ===
        normalize(localizeCity(placeCountry, city) ?? ""))
  );
}
