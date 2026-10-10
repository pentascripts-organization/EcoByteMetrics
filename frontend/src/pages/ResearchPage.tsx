import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, RefreshCw, Search } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RegionMap } from '../components/RegionMap';
import { RegionAlertDialog } from '../components/RegionAlertDialog';
import { useMonitoring } from '../hooks/useMonitoring';
import { getRegionAlert, getRegionIssues, matchesRegion } from '../utils/region';
import type { RegionAlert } from '../utils/region';
import { countries, findCountry, getCities } from '../data/geography';
import { formatNumber } from '../utils/format';

export function ResearchPage() {
  const { snapshot, demoMode, setDemoMode, loading, error, refresh } = useMonitoring();
  const [params] = useSearchParams();
  const [country, setCountry] = useState(params.get('pais') ?? '');
  const [city, setCity] = useState(params.get('cidade') ?? '');
  const [alert, setAlert] = useState<RegionAlert | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [status, setStatus] = useState('Aguardando busca');
  const countryInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const selectedCountry = findCountry(country);
  const cities = selectedCountry ? getCities(selectedCountry.properties.code, snapshot.regions) : [];
  const registeredCountries = new Set(snapshot.regions.map((region) => findCountry(region.country)?.properties.code));
  const availableCountries = countries.filter((feature) => registeredCountries.has(feature.properties.code));
  const region = selectedCountry && city.trim() ? snapshot.regions.find((entry) => matchesRegion({ ...entry, city: entry.city ?? entry.region }, selectedCountry.properties.name, city)) : undefined;
  function chooseCountry(name: string) {
    setCountry(name);
    setCity('');
    setStatus('Aguardando busca');
  }
  function chooseCity(name: string) { setCity(name); setStatus('Região selecionada. Clique em Buscar para verificar o CO₂.'); }
  const dashboardUrl = `/dashboard?${new URLSearchParams({ pais: region?.country ?? country.trim(), cidade: region?.city ?? city.trim(), ...(region ? { regiao: region.code } : {}) })}`;
  async function search(event?: FormEvent) {
    event?.preventDefault();
    setIssues([]);
    if (!demoMode && error && !snapshot.lastCollectionAt) {
      setStatus('Consulta indisponível. Tente atualizar a conexão com as APIs.');
      return;
    }
    if (!demoMode && snapshot.warning && !snapshot.regions.length) { setStatus('API de carbono indisponível. Tente atualizar as regiões.'); return; }
    if (!selectedCountry) { setStatus('Selecione um país.'); return; }
    if (cities.length && !city.trim()) { setStatus('Selecione uma cidade cadastrada.'); return; }
    if (!region) { setAlert('unknown'); setStatus('Região não cadastrada na API'); return; }
    setStatus('Consultando os serviços da região…');
    const latest = await refresh();
    if (!latest) { setStatus('Não foi possível atualizar a consulta. Tente novamente.'); return; }
    const selection = latest.services.filter((service) => service.regionCode === region.code);
    if (!selection.some((service) => service.status !== 'removed')) { setStatus('Região cadastrada, mas sem serviços monitorados no momento.'); return; }
    const kind = getRegionAlert(selection);
    setIssues(getRegionIssues(selection));
    setAlert(kind);
    setStatus(kind === 'unknown' ? 'Região não encontrada' : kind === 'unavailable' ? 'Serviço indisponível' : kind === 'incomplete' ? 'Dados parciais disponíveis' : 'Consulta concluída');
    if (!kind) navigate(dashboardUrl);
  }
  return <div className="research-grid">
    <section className="panel research-form"><span className="eyebrow">UM IMPACTO QUE TEM LUGAR</span><h1>Verificar CO₂ por região</h1><p>Selecione um país no globo, escolha uma cidade e consulte as emissões.</p><ol className="research-steps" aria-label="Etapas da consulta"><li className={selectedCountry ? 'complete' : 'active'}>País</li><li className={city ? 'complete' : selectedCountry ? 'active' : ''}>Cidade</li><li>CO₂</li></ol>
      <form onSubmit={(event) => void search(event)} autoComplete="off"><label htmlFor="research-country">País</label><input ref={countryInput} id="research-country" list="research-countries" placeholder="Escolha no globo ou digite" value={country} onChange={(event) => chooseCountry(event.target.value)} required autoComplete="off" /><datalist id="research-countries">{availableCountries.map((feature) => <option key={feature.properties.code} value={feature.properties.name} />)}</datalist>
        <label htmlFor="research-city">Cidade</label><select id="research-city" value={region?.code ?? ''} onChange={(event) => chooseCity(cities.find((entry) => entry.id === event.target.value)?.name ?? '')} required disabled={!selectedCountry || !cities.length} aria-describedby="research-city-help"><option value="">{!selectedCountry ? 'Selecione primeiro o país' : loading ? 'Carregando cidades…' : !cities.length ? 'Nenhuma cidade cadastrada' : 'Selecione uma cidade'}</option>{cities.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select><p id="research-city-help" className="city-catalog-note">{selectedCountry && cities.length ? 'Cidades de referência cadastradas na API para este país.' : selectedCountry ? 'As cidades aparecerão quando houver regiões disponíveis para este país.' : 'Escolha um país para ver as cidades disponíveis.'}</p>
        <button className="button button-dark" type="submit" disabled={loading}><Search size={17} />{loading ? 'Consultando APIs…' : 'Buscar'}<ArrowRight size={17} /></button>
      </form><Link className="button button-outline" to={region ? dashboardUrl : '/dashboard'}>Ir para o Dashboard<ArrowRight size={17} /></Link>
      <div className="research-status"><span>Status da consulta</span><strong role="status">{status}</strong></div>
      {demoMode && <p className="demo-help">Exemplos: Brasil / São Paulo, França / Paris e Japão / Tóquio.</p>}
      {region && <dl className="api-details region-facts"><div><dt>Região elétrica</dt><dd>{region.region} · {region.code}</dd></div><div><dt>Intensidade de carbono</dt><dd>{formatNumber(region.carbonIntensity)} gCO₂e/kWh</dd></div><div><dt>Energia renovável</dt><dd>{formatNumber(region.renewablePercent)}%</dd></div></dl>}
      <p className="city-catalog-note">{snapshot.regions.length} regiões cadastradas {demoMode ? 'na demonstração' : 'na API'}. Países em verde têm registros; os marcadores mostram as cidades de referência de cada região.</p>
      <button className="button button-outline button-small" disabled={loading} onClick={() => void refresh()}><RefreshCw size={14} />Atualizar regiões</button>
    </section>
    <RegionMap regions={snapshot.regions} catalogUnavailable={Boolean(snapshot.warning)} country={country} city={city} onCountrySelect={chooseCountry} onCitySelect={chooseCity} />
    <RegionAlertDialog kind={alert} issues={issues} demoMode={demoMode} busy={loading} onClose={() => setAlert(null)} onRetry={() => { setAlert(null); void search(); }} onUseLive={() => { setAlert(null); setDemoMode(false); setStatus('Modo real ativado. Aguarde os dados e clique em Buscar.'); }} onAction={() => {
      if (alert === 'incomplete') navigate(dashboardUrl);
      else if (alert === 'unavailable') void search();
      else { setAlert(null); countryInput.current?.focus(); }
    }} />
  </div>;
}
