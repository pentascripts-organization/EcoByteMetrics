import { Component, lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Globe2, RotateCcw } from 'lucide-react';
import type { CarbonRegion } from '../types/monitoring';
import { findCountry, getCities, localizeCity } from '../data/geography';

const WorldGlobe = lazy(() => import('./WorldGlobe'));

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p className="globe-fallback" role="status">A visualização 3D não está disponível neste navegador. Continue pelos campos de país e cidade.</p> : this.props.children;
  }
}

interface RegionMapProps {
  regions: CarbonRegion[];
  catalogUnavailable?: boolean;
  country?: string;
  city?: string;
  date?: string;
  onCountrySelect: (country: string) => void;
  onCitySelect: (city: string) => void;
}

export function RegionMap({ regions, catalogUnavailable = false, country = '', city = '', date, onCountrySelect, onCitySelect }: RegionMapProps) {
  const selectedCountry = findCountry(country);
  const cities = useMemo(() => selectedCountry ? getCities(selectedCountry.properties.code, regions) : [], [selectedCountry, regions]);
  const supportedCountries = useMemo(() => new Set(regions.map((region) => findCountry(region.country)?.properties.code ?? '')), [regions]);
  const selectedCity = cities.find((entry) => entry.name.localeCompare(localizeCity(country, city)?.trim() ?? '', 'pt-BR', { sensitivity: 'base' }) === 0);
  return <section className="region-map globe-map" aria-label="Mapa-múndi 3D" data-country={selectedCountry?.properties.code ?? ''} data-city={city}>
    <div className="globe-heading"><span className="map-label"><Globe2 size={15} />Explore o mundo em 3D</span><button className="button button-outline button-small" onClick={() => onCountrySelect('')}><RotateCcw size={14} />Ver o mundo</button></div>
    <p className="globe-instruction">{selectedCountry ? `2. Escolha uma cidade · ${selectedCountry.properties.name}` : '1. Clique em um país para começar'}<span>Arraste para girar. Use o scroll ou dois dedos para aproximar.</span></p>
    <GlobeBoundary><Suspense fallback={<p className="globe-fallback" role="status">Carregando o globo 3D…</p>}><WorldGlobe supportedCountries={supportedCountries} country={selectedCountry} city={selectedCity} cities={cities} onCountrySelect={onCountrySelect} onCitySelect={onCitySelect} /></Suspense></GlobeBoundary>
    {selectedCountry && <div className="globe-cities" aria-label="Cidades do país selecionado">{cities.length ? cities.map((entry) => <button key={entry.id} className={entry.id === selectedCity?.id ? 'active' : ''} aria-pressed={entry.id === selectedCity?.id} onClick={() => onCitySelect(entry.name)}>{entry.name}</button>) : <p>{catalogUnavailable ? 'Catálogo de regiões temporariamente indisponível. Tente atualizar.' : 'Nenhuma região cadastrada para este país na consulta atual.'}</p>}</div>}
    <div className="globe-selection"><span>REGIÃO SELECIONADA<strong>{[selectedCountry?.properties.name, selectedCity?.name ?? city].filter(Boolean).join(' — ') || 'Escolha um país'}</strong></span>{date && <span>COLETA<strong>{new Date(date).toLocaleString('pt-BR')}</strong></span>}</div>
  </section>;
}
