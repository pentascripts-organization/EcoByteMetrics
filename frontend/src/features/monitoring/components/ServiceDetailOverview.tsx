import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Activity, Clock3, Cpu, Gauge, HardDrive, Layers3, Leaf, MapPin, Wifi, Zap } from "lucide-react";
import type { CollectionPoint, MonitoredService } from "../types";
import type { Period } from "@/shared/lib/period";
import { formatNumber } from "@/shared/lib/format";
import { detailReading } from "../domain/detailReading";
import { ServiceTrendItem } from "./ServiceTrendItem";

export function ServiceReadingMeta({ service, observedAt }: { service: MonitoredService; observedAt?: string | null }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (observedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, [observedAt]);
  const collected = service.lastCollectionAt ? Date.parse(service.lastCollectionAt) : NaN;
  const seconds = Math.max(0, Math.floor(((observedAt ? Date.parse(observedAt) : now) - collected) / 1000));
  const age = seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.floor(seconds / 60)} min` : `${Math.floor(seconds / 3600)} h`;
  return <div className="service-reading-meta">
    <Clock3 size={14} aria-hidden="true" />
    <span title={Number.isFinite(collected) ? new Date(collected).toLocaleString("pt-BR") : undefined}>
      Última coleta válida: {Number.isFinite(collected) ? observedAt ? new Date(collected).toLocaleString("pt-BR") : `há ${age}` : "ainda não realizada"}
    </span>
    {service.status !== "available" && <strong>Leitura preservada · {service.status === "stale" ? "dados desatualizados" : "verifique o estado do monitoramento"}</strong>}
  </div>;
}

export function ServiceDetailOverview({ service, history, period, until, header, historyPanel, onMapAnchor, animateEntry = false }: {
  until?: string;
  onMapAnchor?: (element: HTMLDivElement | null) => void; animateEntry?: boolean;
  header?: ReactNode; historyPanel?: ReactNode;
  service: MonitoredService; services: MonitoredService[]; allServices: MonitoredService[];
  history: CollectionPoint[]; period: Period; onSelectService: (id: string) => void;
}) {
  const energy = detailReading(service.energyKwh, "energy");
  const carbon = detailReading(service.emissionsG, "carbon");
  const coordinates = Number.isFinite(service.latitude) && Number.isFinite(service.longitude);
  const cpu = service.cpuPercent != null && Number.isFinite(service.cpuPercent) ? Math.max(0, Math.min(100, service.cpuPercent)) : null;
  return <div className="service-detail-overview" data-detail-view={historyPanel ? "history" : "overview"} data-detail-entry={animateEntry || undefined}>
    <div className="service-identity">{header}</div>

    <div className="service-detail-columns">
      <section className="monitoring-detail-card service-resources" aria-labelledby="service-resources-title">
        <div className="monitoring-section-heading"><div><h2 id="service-resources-title"><Layers3 size={22} aria-hidden="true" />Recursos da última coleta</h2><p className="monitoring-section-subtitle">Uso de recursos no mesmo intervalo das estimativas.</p></div></div>
        <div className="service-resource-layout">
          <dl className="service-cpu-dial" data-missing={cpu === null} style={{"--cpu-sweep": `${(cpu ?? 0) * 3.6}deg`} as CSSProperties}>
            <div className="service-cpu-value"><dt><Cpu size={24} aria-hidden="true" />CPU</dt>
              <dd title={service.cpuPercent == null ? "Dado não disponível" : `${service.cpuPercent.toLocaleString("pt-BR")} %`}>{cpu === null ? "—" : service.cpuPercent!.toLocaleString("pt-BR", {maximumFractionDigits:1})}<small>%</small></dd>
            </div>
          </dl>
          <dl className="service-resource-grid">
            {([ ["Memória", service.memoryGb, "GB", Activity], ["Disco", service.diskGb, "GB", HardDrive], ["Rede", service.networkGb, "GB", Wifi] ] as const).map(([label, value, unit, Icon]) => <div className="service-resource" key={label}>
              <dt><Icon size={18} aria-hidden="true" />{label}</dt>
              <dd title={value == null ? "Dado não disponível" : `${value.toLocaleString("pt-BR", {maximumSignificantDigits:15})} ${unit}`}>
                {value == null ? "—" : value.toLocaleString("pt-BR", {maximumFractionDigits:2})} <small>{unit}</small>
              </dd>
            </div>)}
          </dl>
        </div>
        {service.statusMessage && <p className="service-message">{service.statusMessage}</p>}
        <p className="monitoring-explanation">“—” indica dado ausente. Uma leitura preservada não representa uma nova coleta.</p>
        {history.length >= 2 && <ServiceTrendItem service={service} metric="emissions" period={period} until={until} preloadedHistory={history} isExpanded={false} />}
      </section>
    </div>
    <section className="service-globe" aria-label="Localização geográfica da aplicação">
      <div className="service-globe-orbit service-globe-orbit--one" aria-hidden="true" />
      <div className="service-globe-orbit service-globe-orbit--two" aria-hidden="true" />
        {coordinates ? <div className="monitoring-map globe-anchor" ref={onMapAnchor}><div className="globe-stage" aria-hidden="true" /></div>
          : <div className="service-map-unavailable" role="status"><MapPin size={28} aria-hidden="true" /><strong>Sem coordenadas disponíveis</strong><span>A localização informada continua disponível acima.</span></div>}
    </section>
    <aside className="service-impact-column">{historyPanel ? <div className="service-history-card">{historyPanel}</div> : <>
    <section className="service-impact" aria-labelledby="service-impact-title">
      <div className="monitoring-section-heading"><div>
        <h2 id="service-impact-title"><Leaf size={22} aria-hidden="true" />Impacto estimado na última coleta</h2>
        <p className="monitoring-section-subtitle">Energia e emissões estimadas para o intervalo da leitura, não totais acumulados.</p>
      </div></div>
      <dl className="service-impact-grid">
        <div className="service-kpi service-kpi--energy"><dt><Zap size={18} aria-hidden="true" />Energia na última coleta</dt><dd title={energy.exact} key={energy.exact}>{energy.value} <small>{energy.unit}</small></dd></div>
        <div className="service-kpi service-kpi--carbon"><dt><Leaf size={18} aria-hidden="true" />CO₂e na última coleta</dt><dd title={carbon.exact} key={carbon.exact}>{carbon.value} <small>{carbon.unit}</small></dd></div>
        <div className="service-kpi"><dt><Gauge size={18} aria-hidden="true" />Intensidade regional</dt><dd>{formatNumber(service.carbonIntensity ?? null)} <small>g CO₂e/kWh</small></dd></div>
        <div className="service-kpi"><dt><Clock3 size={18} aria-hidden="true" />Duração da leitura</dt><dd>{formatNumber(service.collectionIntervalSeconds ?? null)} <small>s</small></dd></div>
      </dl>
    </section>
    </>}</aside>
  </div>;
}
