import { Component, lazy, Suspense, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { CollectionPoint, MonitoredService } from "../../types";
import { groupServiceLocations } from "../../domain/dashboard";
import { impactLocations } from "../../domain/observatory";
import type { ImpactLens } from "../../domain/observatory";
import { findCountry } from "@/shared/geography/geography";
import { ArrowUpRight, Leaf, MapPin, Maximize2, X, Zap } from "lucide-react";
import { detailReading } from "../../domain/detailReading";
import { StatusBadge } from "../StatusBadge";

const WorldGlobe = lazy(() => import("./WorldGlobe"));
import { ExpandedGlobe } from "./ExpandedGlobe";

const emptyHistory: CollectionPoint[] = [];

function MapNotice({children, anchorElement}: {children: ReactNode; anchorElement?: HTMLElement | null}) {
  const message = <p className="globe-fallback" role="status">{children}</p>;
  return anchorElement ? createPortal(message, anchorElement) : anchorElement === undefined ? message : null;
}

class GlobeBoundary extends Component<{ children: ReactNode; anchorElement?: HTMLElement | null }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <MapNotice anchorElement={this.props.anchorElement}>Mapa indisponível. A localização textual e as métricas continuam disponíveis.</MapNotice> : this.props.children;
  }
}

export function RegionMap({ services, allServices, selectedServiceId, onSelectService, history = emptyHistory, lens = "status", highlightedServiceIds = [], focusServiceId, onHighlightServices, rotationPaused = false, inline = false, anchorElement, detailView = false }: {
  services: MonitoredService[];
  allServices?: MonitoredService[];
  selectedServiceId?: string;
  onSelectService: (id: string) => void;
  history?: CollectionPoint[];
  lens?: ImpactLens;
  highlightedServiceIds?: string[];
  focusServiceId?: string;
  onHighlightServices?: (ids: string[]) => void;
  rotationPaused?: boolean;
  inline?: boolean;
  anchorElement?: HTMLElement | null;
  detailView?: boolean;
}) {
  const [groupId, setGroupId] = useState("");
  const [expanded, setExpanded] = useState(false);
  const closeExpanded = useCallback(() => setExpanded(false), []);
  const groups = useMemo(() => impactLocations(services, history, lens), [services, history, lens]);
  const countryCodes = useMemo(() => [...new Set((allServices ?? services).map(service => findCountry(service.country ?? "")?.properties.code).filter(Boolean))].sort().join(","), [allServices, services]);
  const supportedCountries = useMemo(() => new Set(countryCodes.split(",").filter(Boolean)), [countryCodes]);
  const selectedService = (allServices ?? services).find(service => service.id === selectedServiceId);
  // Removed services retain their camera destination without reappearing as live markers.
  const selected = groups.find(group => group.services.some(service => service.id === selectedServiceId))
    ?? groupServiceLocations(selectedService ? [selectedService] : [], true)[0];
  const choosing = groups.find(group => group.id === groupId);
  const highlightedCityId = groups.find(group => group.services.some(service => highlightedServiceIds.includes(service.id)))?.id;
  const focusCity = groups.find(group => group.services.some(service => service.id === focusServiceId));
  const selectPoint = useCallback((id: string) => {
    const group = groups.find(entry => entry.id === id);
    if (!group) return;
    setGroupId(id);
    if (group.services.length === 1) { setExpanded(false); setGroupId(""); onSelectService(group.services[0]!.id); }
  }, [groups, onSelectService]);
  const highlightPoint = useCallback((id: string, active: boolean) => {
    const group = groups.find(entry => entry.id === id);
    onHighlightServices?.(active && group ? group.services.map(service => service.id) : []);
  }, [groups, onHighlightServices]);
  const buttons = <>
    {!inline && !detailView && <button type="button" className="globe-expand-button" aria-label="Expandir visão do globo" title="Expandir visão do globo" aria-expanded={expanded} onClick={() => setExpanded(true)}><Maximize2 size={18} aria-hidden="true" /></button>}
    {expanded && <ExpandedGlobe onClose={closeExpanded} />}
</>;
  const popup = choosing && (
      <div className="map-popup-card" role="dialog" aria-label={"Aplicações em " + choosing.name} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setGroupId(""); } }}>
        <div className="map-popup-header">
          <div className="map-popup-place"><span className="map-popup-place-icon"><MapPin size={19} aria-hidden="true" /></span><div><strong className="map-popup-title">{choosing.name}</strong><span className="map-popup-count">{choosing.count} {choosing.count === 1 ? "aplicação nesta localização" : "aplicações nesta localização"}</span></div></div>
          <button type="button" className="map-popup-close" onClick={() => setGroupId("")} aria-label="Fechar popup de aplicações"><X size={18} aria-hidden="true" /></button>
        </div>
        <p className="map-popup-context">Estimativas da última coleta de cada aplicação</p>
        <div className="map-popup-content">
          {choosing.services.map(service => {
            const energy = detailReading(service.energyKwh, "energy");
            const carbon = detailReading(service.emissionsG, "carbon");
            return (
            <div key={service.id} className="map-popup-item">
              <div className="map-popup-item-header">
                <span className="map-popup-service-name">{service.name}</span>
                <StatusBadge status={service.status} />
              </div>
              <div className="map-popup-metrics">
                <div className="map-popup-metric">
                  <span className="map-popup-metric-label"><Zap size={13} aria-hidden="true" />Energia</span>
                  <span className="map-popup-metric-value" title={energy.exact}>{energy.value} <small>{energy.unit}</small></span>
                </div>
                <div className="map-popup-metric">
                  <span className="map-popup-metric-label"><Leaf size={13} aria-hidden="true" />Emissões</span>
                  <span className="map-popup-metric-value" title={carbon.exact}>{carbon.value} <small>{carbon.unit}</small></span>
                </div>
              </div>
              <button type="button" className="map-popup-action" aria-label={"Ver detalhes de " + service.name} onClick={() => { setExpanded(false); setGroupId(""); onSelectService(service.id); }}>
                Ver aplicação <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </div>
          ); })}
        </div>
      </div>
    );
  return <div className={anchorElement === undefined ? "monitoring-map" : "monitoring-map-runtime"}>
    <GlobeBoundary anchorElement={anchorElement}><Suspense fallback={<MapNotice anchorElement={anchorElement}>Carregando o globo 3D…</MapNotice>}>
      <WorldGlobe anchorElement={anchorElement} detailView={detailView} expanded={expanded} inline={inline} services={allServices ?? services} supportedCountries={supportedCountries} cities={groups} city={selected} selectedServiceId={selectedServiceId}
        onPointSelect={selectPoint} onPointHover={highlightPoint} highlightedCityId={highlightedCityId} focusCity={focusCity} rotationPaused={rotationPaused || expanded} />
    </Suspense></GlobeBoundary>
    {anchorElement ? createPortal(<>{buttons}{popup}</>, anchorElement) : anchorElement === undefined ? <>{buttons}{popup}</> : null}
  </div>;
}
