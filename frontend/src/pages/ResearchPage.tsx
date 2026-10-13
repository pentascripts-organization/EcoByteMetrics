import { useEffect, useRef, useState } from 'react';
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
import { analysisQuery } from '../utils/analysis';

export function ResearchPage() {
  const { snapshot, demoMode, setDemoMode, loading, refresh } = useMonitoring();
  const [params, setParams] = useSearchParams();
  const regionCode = params.get('regiao') ?? '';
  const registeredRegion = snapshot.regions.find((entry) => entry.code === regionCode);
  const country = params.get('pais') ?? registeredRegion?.country ?? '';
  const city = params.get('cidade') ?? registeredRegion?.city ?? registeredRegion?.region ?? '';
  const [alert, setAlert] = useState<RegionAlert | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [status, setStatus] = useState('Aguardando busca');
  const countryInput = useRef<HTMLInputElement>(null);
  const searchToken = useRef(0);
  const selectionKey = JSON.stringify([country, city, regionCode]);
  useEffect(() => () => { searchToken.current++; }, [selectionKey, demoMode]);
  const closeAlert = () => { searchToken.current++; setAlert(null); };
  const navigate = useNavigate();
  const selectedCountry = findCountry(country);
  const cities = selectedCountry ? getCities(selectedCountry.properties.code, snapshot.regions) : [];
  const registeredCountries = new Set(snapshot.regions.map((region) => findCountry(region.country)?.properties.code));
  const availableCountries = countries.filter((feature) => registeredCountries.has(feature.properties.code));
  const matches = selectedCountry && city.trim() ? snapshot.regions.filter((entry) => matchesRegion({ ...entry, city: entry.city ?? entry.region }, selectedCountry.properties.name, city)) : [];
  const region = matches.find((entry) => entry.code === regionCode) ?? (matches.length === 1 ? matches[0] : undefined);
  function chooseCountry(name: string) {
    searchToken.current++;
    const next = new URLSearchParams(params);
    next.set('pais', name);
    for (const key of ['cidade', 'regiao', 'ate']) next.delete(key);
    setParams(next, { replace: true });
    setAlert(null);
    setIssues([]);
    setStatus('Aguardando busca');
  }
  function chooseCity(name: string, selectedCode = '') {
    searchToken.current++;
    const next = new URLSearchParams(params);
    next.set('pais', selectedCountry?.properties.name ?? country);
    next.set('cidade', name);
    if (selectedCode) next.set('regiao', selectedCode); else next.delete('regiao');
    next.delete('ate');
    setParams(next, { replace: true });
    setAlert(null);
    setIssues([]);
    setStatus('Região selecionada. Clique em Buscar para verificar o CO₂.');
  }
  function regionalDashboard(code: string, selectedCountry: string, selectedCity: string | null) {
    const query = analysisQuery(params.toString());
    query.set('pais', selectedCountry);
    query.set('cidade', selectedCity ?? '');
    query.set('regiao', code);
    query.delete('ate');
    return '/dashboard?' + query.toString();
  }
  const dashboardUrl = region ? regionalDashboard(region.code, region.country, region.city) : '/dashboard';
  async function search(event?: FormEvent) {
    event?.preventDefault();
    setIssues([]);
    if (!selectedCountry) { setStatus('Selecione um país válido.'); return; }
    if (cities.length && !city.trim()) { setStatus('Selecione uma cidade cadastrada.'); return; }
    if (snapshot.regions.length && !region) { setAlert('unknown'); setStatus('Região não cadastrada na API'); return; }
    const token = ++searchToken.current;
    const selectedCode = region?.code;
    setStatus('Consultando os serviços da região…');
    const latest = await refresh();
    if (token !== searchToken.current) return;
    if (!latest) { setStatus('Consulta indisponível. Tente atualizar a conexão e buscar novamente.'); return; }
    if (latest.warning && !latest.regions.length) { setStatus('Catálogo de regiões indisponível. Tente atualizar as regiões.'); return; }
    const candidates = latest.regions.filter((entry) => matchesRegion({ ...entry, city: entry.city ?? entry.region }, selectedCountry.properties.name, city));
    const latestRegion = latest.regions.find((entry) => entry.code === selectedCode) ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (!latestRegion) { setAlert('unknown'); setStatus('A região não está disponível no catálogo atual.'); return; }
    const selection = latest.services.filter((service) => service.regionCode === latestRegion.code);
    if (!selection.some((service) => service.status !== 'removed')) { setStatus('Região cadastrada, mas sem serviços monitorados no momento.'); return; }
    const kind = getRegionAlert(selection);
    setIssues(getRegionIssues(selection));
    setAlert(kind);
    setStatus(kind === 'unavailable' ? 'Serviço indisponível' : kind === 'incomplete' ? 'Dados parciais disponíveis' : 'Consulta concluída');
    if (!kind) navigate(regionalDashboard(latestRegion.code, latestRegion.country, latestRegion.city));
  }
  return <div className="research-grid">
    <section className="panel research-form"><span className="eyebrow">UM IMPACTO QUE TEM LUGAR</span><h1>Verificar CO₂ por região</h1><p>Selecione um país no globo, escolha uma cidade e consulte as emissões.</p><ol className="research-steps" aria-label="Etapas da consulta"><li className={selectedCountry ? 'complete' : 'active'}>País</li><li className={city ? 'complete' : selectedCountry ? 'active' : ''}>Cidade</li><li>CO₂</li></ol>
      <form onSubmit={(event) => void search(event)} autoComplete="off"><label htmlFor="research-country">País</label><input ref={countryInput} id="research-country" list="research-countries" placeholder="Escolha no globo ou digite" value={country} onChange={(event) => chooseCountry(event.target.value)} required autoComplete="off" /><datalist id="research-countries">{availableCountries.map((feature) => <option key={feature.properties.code} value={feature.properties.name} />)}</datalist>
        <label htmlFor="research-city">Cidade</label><select id="research-city" value={region?.code ?? ''} onChange={(event) => chooseCity(cities.find((entry) => entry.id === event.target.value)?.name ?? '', event.target.value)} required disabled={!selectedCountry || !cities.length} aria-describedby="research-city-help"><option value="">{!selectedCountry ? 'Selecione primeiro o país' : loading ? 'Carregando cidades…' : !cities.length ? 'Nenhuma cidade cadastrada' : 'Selecione uma cidade'}</option>{cities.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}{cities.filter((candidate) => candidate.name === entry.name).length > 1 ? ' · ' + entry.id : ''}</option>)}</select><p id="research-city-help" className="city-catalog-note">{selectedCountry && cities.length ? 'Cidades de referência cadastradas na API para este país.' : selectedCountry ? 'As cidades aparecerão quando houver regiões disponíveis para este país.' : 'Escolha um país para ver as cidades disponíveis.'}</p>
        <button className="button button-dark" type="submit" disabled={loading}><Search size={17} />{loading ? 'Consultando APIs…' : 'Buscar'}<ArrowRight size={17} /></button>
      </form><Link className="button button-outline" to={region ? dashboardUrl : '/dashboard'}>Ir para o Dashboard<ArrowRight size={17} /></Link>
      <div className="research-status"><span>Status da consulta</span><strong role="status">{status}</strong></div>
      {demoMode && <p className="demo-help">Exemplos: Brasil / São Paulo, França / Paris e Japão / Tóquio.</p>}
      {region && <dl className="api-details region-facts"><div><dt>Região elétrica</dt><dd>{region.region} · {region.code}</dd></div><div><dt>Intensidade de carbono</dt><dd>{formatNumber(region.carbonIntensity)} gCO₂e/kWh</dd></div><div><dt>Energia renovável</dt><dd>{formatNumber(region.renewablePercent)}%</dd></div></dl>}
      <p className="city-catalog-note">{snapshot.regions.length} regiões cadastradas {demoMode ? 'na demonstração' : 'na API'}. Países em verde têm registros; os marcadores mostram as cidades de referência de cada região.</p>
      <button className="button button-outline button-small" disabled={loading} onClick={() => void refresh()}><RefreshCw size={14} />Atualizar regiões</button>
    </section>
    <RegionMap regionCode={region?.code} onRegionSelect={(code, name) => chooseCity(name, code)} regions={snapshot.regions} catalogUnavailable={Boolean(snapshot.warning)} country={country} city={city} onCountrySelect={chooseCountry} onCitySelect={chooseCity} />
    <RegionAlertDialog kind={alert} issues={issues} demoMode={demoMode} busy={loading} onClose={closeAlert} onRetry={() => { setAlert(null); void search(); }} onUseLive={() => { setAlert(null); setDemoMode(false); const next = new URLSearchParams(params); next.delete('regiao'); next.delete('ate'); setParams(next, { replace: true }); setStatus('Modo real ativado. Aguarde os dados e clique em Buscar.'); }} onAction={() => {
      if (alert === 'incomplete') navigate(dashboardUrl);
      else if (alert === 'unavailable') void search();
      else { setAlert(null); countryInput.current?.focus(); }
    }} />
  </div>;
}
