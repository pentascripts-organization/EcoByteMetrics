import { useEffect, useState } from "react";
import { Activity, Clock3, Cpu, Gauge, HardDrive, Leaf, MapPin, Wifi, Zap } from "lucide-react";
import type { CollectionPoint, MonitoredService } from "../types";
import type { Period } from "@/shared/lib/period";
import { formatNumber } from "@/shared/lib/format";
import { detailReading } from "../domain/detailReading";
import { RegionMap } from "./map/RegionMap";
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
    <span>Consulta da interface a cada 30 s</span>
    {service.status !== "available" && <strong>Leitura preservada · {service.status === "stale" ? "dados desatualizados" : "verifique o estado do monitoramento"}</strong>}
  </div>;
}

export function ServiceDetailOverview({ service, services, allServices, history, period, onSelectService }: {
  service: MonitoredService; services: MonitoredService[]; allServices: MonitoredService[];
  history: CollectionPoint[]; period: Period; onSelectService: (id: string) => void;
}) {
  const energy = detailReading(service.energyKwh, "energy");
  const carbon = detailReading(service.emissionsG, "carbon");
  const coordinates = Number.isFinite(service.latitude) && Number.isFinite(service.longitude);
  const location = [service.city, service.region, service.country].filter(Boolean).join(" · ") || "Localização não informada";
  return <div className="service-detail-overview">
    <section className="service-impact" aria-labelledby="service-impact-title">
      <div className="monitoring-section-heading"><div>
        <h2 id="service-impact-title">Impacto estimado na última coleta</h2>
        <p className="monitoring-section-subtitle">Energia e emissões estimadas para o intervalo da leitura, não totais acumulados.</p>
      </div></div>
      <dl className="service-impact-grid">
        <div className="service-kpi service-kpi--energy"><dt><Zap size={18} aria-hidden="true" />Energia na última coleta</dt><dd title={energy.exact} key={energy.exact}>{energy.value} <small>{energy.unit}</small></dd></div>
        <div className="service-kpi service-kpi--carbon"><dt><Leaf size={18} aria-hidden="true" />CO₂e na última coleta</dt><dd title={carbon.exact} key={carbon.exact}>{carbon.value} <small>{carbon.unit}</small></dd></div>
        <div className="service-kpi"><dt><Gauge size={18} aria-hidden="true" />Intensidade regional</dt><dd>{formatNumber(service.carbonIntensity ?? null)} <small>g CO₂e/kWh</small></dd></div>
        <div className="service-kpi"><dt><Clock3 size={18} aria-hidden="true" />Duração da leitura</dt><dd>{formatNumber(service.collectionIntervalSeconds ?? null)} <small>s</small></dd></div>
      </dl>
    </section>
    <div className="service-detail-columns">
      <section className="monitoring-detail-card service-resources" aria-labelledby="service-resources-title">
        <div className="monitoring-section-heading"><div><h2 id="service-resources-title">Recursos da última coleta</h2><p className="monitoring-section-subtitle">Uso de recursos no mesmo intervalo das estimativas.</p></div></div>
        <dl className="service-resource-grid">
          {([ ["CPU", service.cpuPercent, "%", Cpu], ["Memória", service.memoryGb, "GB", Activity],
            ["Disco", service.diskGb, "GB", HardDrive], ["Rede", service.networkGb, "GB", Wifi] ] as const).map(([label, value, unit, Icon]) => <div className="service-resource" key={label}>
            <dt><Icon size={18} aria-hidden="true" />{label}</dt>
            <dd title={value == null ? "Dado não disponível" : `${value.toLocaleString("pt-BR", { maximumSignificantDigits: 15 })} ${unit}`} key={String(value)}>
              {value == null ? "—" : value.toLocaleString("pt-BR", { maximumFractionDigits: label === "CPU" ? 1 : 2 })} <small>{unit}</small>
            </dd>
            {label === "CPU" && value != null && <div className="monitoring-resource-meter" aria-hidden="true"><div className="monitoring-resource-meter__fill" style={{width: `${Math.min(100, Math.max(0, value))}%`}} /></div>}
          </div>)}
        </dl>
        {service.statusMessage && <p className="service-message">{service.statusMessage}</p>}
        <p className="monitoring-explanation">“—” indica dado ausente. Uma leitura preservada não representa uma nova coleta.</p>
        {history.length >= 2 && <ServiceTrendItem service={service} metric="emissions" period={period} preloadedHistory={history} isExpanded={false} />}
      </section>
      <section className="monitoring-detail-card service-location" aria-labelledby="service-location-title">
        <div className="monitoring-section-heading"><h2 id="service-location-title"><MapPin size={18} aria-hidden="true" />Localização</h2></div>
        <p className="service-location-name">{location}</p>
        {coordinates ? <RegionMap inline services={services} allServices={allServices} selectedServiceId={service.id} onSelectService={onSelectService} history={history} rotationPaused />
          : <div className="service-map-unavailable" role="status"><MapPin size={28} aria-hidden="true" /><strong>Sem coordenadas disponíveis</strong><span>A localização informada continua disponível acima.</span></div>}
      </section>
    </div>
  </div>;
}
