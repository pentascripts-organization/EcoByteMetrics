import { Component, lazy, Suspense, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MonitoredService } from "../../types";
import { groupServiceLocations, statusColors } from "../../domain/dashboard";
import { findCountry } from "@/shared/geography/geography";
import { serviceStatusLabels } from "../../types";

const WorldGlobe = lazy(() => import("./WorldGlobe"));

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p className="globe-fallback" role="status">O globo 3D está indisponível. Continue pela lista de aplicações.</p> : this.props.children;
  }
}

export function RegionMap({ services, selectedServiceId, onSelectService }: {
  services: MonitoredService[];
  selectedServiceId?: string;
  onSelectService: (id: string) => void;
}) {
  const [groupId, setGroupId] = useState("");
  const groups = useMemo(() => groupServiceLocations(services), [services]);
  const supportedCountries = useMemo(() => new Set(services.map(service => findCountry(service.country ?? "")?.properties.code ?? "")), [services]);
  const selected = groups.find(group => group.services.some(service => service.id === selectedServiceId));
  const choosing = groups.find(group => group.id === groupId);
  return <div className="monitoring-map">
    <GlobeBoundary><Suspense fallback={<p className="globe-fallback" role="status">Carregando o globo 3D…</p>}>
      <WorldGlobe supportedCountries={supportedCountries} cities={groups} city={selected}
        onPointSelect={id => {
          const group = groups.find(entry => entry.id === id);
          if (!group) return;
          if (group.services.length === 1) onSelectService(group.services[0]!.id);
          else setGroupId(id);
        }} />
    </Suspense></GlobeBoundary>
    {choosing && <div className="map-choices" aria-label={"Aplicações em " + choosing.name}>
      <div><strong>{choosing.name} · {choosing.count} serviços</strong><button onClick={() => setGroupId("")} aria-label="Fechar seleção de aplicações">Fechar</button></div>
      {choosing.services.map(service => <button key={service.id} onClick={() => onSelectService(service.id)}><span>{service.name}</span><span className="monitoring-status"><i style={{ background: statusColors[service.status] }} />{serviceStatusLabels[service.status]}</span></button>)}
    </div>}
  </div>;
}
