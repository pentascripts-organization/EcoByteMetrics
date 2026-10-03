import { ArrowUpRight, CalendarDays, CircleDashed, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMonitoring } from '../hooks/useMonitoring';
import type { Period } from '../types/monitoring';

export function IconTile({ icon: Icon, tone = 'green' }: { icon: LucideIcon; tone?: 'green' | 'blue' | 'amber' }) {
  return <span className={`icon-tile icon-tile-${tone}`}><Icon size={21} strokeWidth={1.65} /></span>;
}

export function EmptyState({ icon: Icon = CircleDashed, title, description, compact = false, action }: {
  icon?: LucideIcon; title: string; description: string; compact?: boolean; action?: ReactNode;
}) {
  return <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
    <span className="empty-state-icon"><Icon size={28} strokeWidth={1.3} /></span>
    <h3>{title}</h3><p>{description}</p>{action}
  </div>;
}

export function Panel({ title, eyebrow, icon: Icon, link, children, className = '' }: {
  title: string; eyebrow?: string; icon?: LucideIcon; link?: { to: string; label: string }; children: ReactNode; className?: string;
}) {
  return <section className={`panel ${className}`}>
    <div className="panel-heading"><div className="panel-title-group">
      {Icon && <IconTile icon={Icon} />}<div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
    </div>{link && <Link className="text-link" to={link.to}>{link.label}<ArrowUpRight size={16} /></Link>}</div>
    {children}
  </section>;
}

export function PeriodSelect() {
  const { period, setPeriod } = useMonitoring();
  return <label className="period-select"><CalendarDays size={17} /><span className="sr-only">Período de análise</span>
    <select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
      <option value="24h">Últimas 24 horas</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option>
    </select>
  </label>;
}

export function PageHeading({ eyebrow = 'SEU AMBIENTE, EM PERSPECTIVA', title, description, refresh = false }: {
  eyebrow?: string; title: string; description: string; refresh?: boolean;
}) {
  const { refresh: refreshData, loading } = useMonitoring();
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
    <div className="page-actions"><PeriodSelect />{refresh && <button className="button button-icon" title="Atualizar indicadores" aria-label="Atualizar indicadores" disabled={loading} onClick={() => void refreshData()}><RefreshCw size={18} className={loading ? 'spin' : ''} /></button>}</div>
  </div>;
}

export function MetricCard({ label, value, unit, icon, note, tone = 'green' }: {
  label: string; value: string; unit?: string; icon: LucideIcon; note: string; tone?: 'green' | 'blue' | 'amber';
}) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><IconTile icon={icon} tone={tone} /></div>
    <div className="metric-value">{value}{unit && <span>{unit}</span>}</div><div className="metric-note"><span className="neutral-dot" />{note}</div>
  </article>;
}

export function TrendChart({ metric = 'emissions' }: { metric?: 'emissions' | 'energy' }) {
  const { snapshot } = useMonitoring();
  const points = snapshot.history;
  const values = points.map((point) => metric === 'emissions' ? point.emissionsG : point.energyKwh);
  const max = Math.max(...values, 1);
  const coordinates = values.map((value, index) => `${45 + index / Math.max(values.length - 1, 1) * 650},${180 - value / max * 150}`).join(' ');
  return <div className={`trend-chart${points.length ? ' trend-chart-populated' : ''}`}>
    <div className="chart-unit">{metric === 'emissions' ? 'gCO₂e' : 'kWh'}</div>
    <div className="chart-grid" aria-hidden="true">{[0, 1, 2, 3].map((index) => <div key={index} className="chart-grid-line" />)}</div>
    {points.length ? <svg viewBox="0 0 740 210" role="img" aria-label={`Evolução de ${metric === 'emissions' ? 'emissões' : 'energia'} no período selecionado`}><polyline points={coordinates} fill="none" stroke="#169c7c" strokeWidth="3" />{values.length === 1 && <circle cx="45" cy={180 - (values[0] ?? 0) / max * 150} r="4" fill="#169c7c" />}</svg> :
      <EmptyState icon={metric === 'emissions' ? CircleDashed : RefreshCw} compact title="Seu histórico começa aqui" description="As primeiras coletas darão vida a este gráfico." />}
    <div className="chart-axis"><span>Início do período</span><span>Fim do período</span></div>
  </div>;
}
