import { useEffect, useState } from "react";
import { ChevronDown, Server, Settings2 } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useMonitoring } from "../../hooks/useMonitoring";
import { StatusBadge } from "../StatusBadge";

function parseSettings(value: unknown) {
  if (!value || typeof value !== "object" || !("collectionIntervalSeconds" in value) ||
      typeof value.collectionIntervalSeconds !== "number" || !Number.isFinite(value.collectionIntervalSeconds) ||
      value.collectionIntervalSeconds <= 0 || !("discovery" in value) || value.discovery !== "automatic" ||
      !("editable" in value) || typeof value.editable !== "boolean") throw new Error("Configuração inválida.");
  return value.collectionIntervalSeconds;
}

export function MonitoringSettingsCard() {
  const { request, session } = useAuth();
  const [seconds, setSeconds] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void request("/api/monitoring-settings", { signal: controller.signal }).then(parseSettings).then(value => {
      if (!controller.signal.aborted) { setSeconds(value); setFailed(false); }
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [request, session, attempt]);

  return <section className="administration-card" aria-labelledby="collection-settings-title">
    <header className="administration-card-heading">
      <Settings2 size={22} aria-hidden="true" />
      <div><h3 id="collection-settings-title">Configuração da coleta</h3><p>Parâmetros de coleta e descoberta de serviços.</p></div>
      <span className="administration-tag">Somente leitura</span>
    </header>
    {failed ? <div className="administration-feedback">
      <p role="alert">Não foi possível consultar a configuração da coleta.</p>
      <button type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Tentar novamente</button>
    </div> : seconds === null ? <p role="status">Consultando configuração…</p> :
      <dl className="administration-details">
        <div><dt>Descoberta</dt><dd>Automática</dd></div>
        <div><dt>Intervalo da coleta</dt><dd>{seconds.toLocaleString("pt-BR")} segundos</dd></div>
      </dl>}
  </section>;
}

const collectionTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

export function MonitoredServicesCard() {
  const { snapshot, loading, error, refresh } = useMonitoring();
  const { services } = snapshot;
  const rows = services.map(service => {
    const timestamp = Date.parse(service.lastCollectionAt ?? "");
    return {
      service,
      region: [service.city, service.region, service.country].filter(Boolean).join(" · ") || "Não informada",
      collection: Number.isFinite(timestamp)
        ? <time dateTime={service.lastCollectionAt!}>{collectionTime.format(timestamp)}</time>
        : "Sem coleta",
    };
  });
  return <section className="administration-card administration-services" aria-labelledby="monitored-services-title">
    <header className="administration-card-heading">
      <Server size={22} aria-hidden="true" />
      <div><h3 id="monitored-services-title">Serviços monitorados</h3><p>Aplicações identificadas e acompanhadas pelo sistema.</p></div>
      {rows.length > 0 && <span className="administration-tag" id="monitored-services-count">{rows.length} {rows.length === 1 ? "serviço" : "serviços"}</span>}
    </header>
    {(error || snapshot.warning) && <div className="administration-feedback">
      <p role="alert">{services.length ? "Alguns dados podem estar desatualizados." : "Não foi possível consultar os serviços."}</p>
      <button type="button" disabled={loading} onClick={() => void refresh()}>Tentar novamente</button>
    </div>}
    {services.length ? <>
      <div className="administration-table" role="region" aria-labelledby="monitored-services-title" aria-describedby="monitored-services-count" tabIndex={0}>
        <table>
          <thead><tr><th scope="col">Aplicação</th><th scope="col">Região</th><th scope="col">Estado</th><th scope="col">Última coleta</th></tr></thead>
          <tbody>{rows.map(({ service, region, collection }) => <tr key={service.id}>
            <th scope="row">{service.name}</th><td>{region}</td>
            <td><StatusBadge status={service.status} /></td><td>{collection}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <ul className="administration-service-list">
        {rows.map(({ service, region, collection }) => <li key={service.id}>
          <details>
            <summary>
              <span className="administration-service-name">{service.name}</span>
              <StatusBadge status={service.status} />
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <dl className="administration-details">
              <div><dt>Região</dt><dd>{region}</dd></div>
              <div><dt>Última coleta</dt><dd>{collection}</dd></div>
            </dl>
          </details>
        </li>)}
      </ul>
    </> : !error && !snapshot.warning && <p role="status">{loading || !snapshot.refreshedAt ? "Consultando serviços…" : "Nenhum serviço monitorado."}</p>}
  </section>;
}
