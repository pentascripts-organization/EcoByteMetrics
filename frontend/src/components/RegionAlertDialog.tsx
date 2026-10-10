import { useEffect, useRef } from 'react';
import { Activity, ChartNoAxesCombined, MapPin, X } from 'lucide-react';
import type { RegionAlert } from '../utils/region';

const alerts = {
  unknown: { label: 'ALERTA DE REGIÃO', title: 'Região desconhecida', description: 'Essa região não está registrada. Verifique o país e a cidade digitados e tente novamente.', action: 'Nova busca', icon: MapPin, tone: 'blue' },
  unavailable: { label: 'ALERTA DE SERVIÇO', title: 'Serviço indisponível', description: 'O serviço está listado, mas indisponível no momento. Tente novamente em alguns instantes.', action: 'Tentar novamente', icon: Activity, tone: 'amber' },
  incomplete: { label: 'ALERTA DE MÉTRICAS', title: 'Métricas incompletas', description: 'Algumas métricas estão faltando para essa região. Os dados disponíveis serão exibidos no dashboard.', action: 'Ver dashboard', icon: ChartNoAxesCombined, tone: 'green' },
};

export function RegionAlertDialog({ kind, issues, demoMode, busy, onClose, onAction, onRetry, onUseLive }: { kind: RegionAlert | null; issues: string[]; demoMode: boolean; busy: boolean; onClose: () => void; onAction: () => void; onRetry: () => void; onUseLive: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (kind && !dialog.current?.open) dialog.current?.showModal();
    else if (!kind && dialog.current?.open) dialog.current.close();
  }, [kind]);
  const alert = alerts[kind ?? 'unknown'];
  const Icon = alert.icon;
  return <dialog ref={dialog} className={`region-alert alert-${alert.tone}`} aria-labelledby="region-alert-title" aria-describedby="region-alert-description region-alert-details" onCancel={onClose}>
    <button className="alert-close" aria-label="Fechar alerta" onClick={onClose}><X size={18} /></button>
    <span className={`icon-tile icon-tile-${alert.tone}`}><Icon size={25} /></span>
    <span className="alert-eyebrow">{demoMode ? 'SIMULAÇÃO · MODO DEMONSTRAÇÃO' : alert.label}</span><h2 id="region-alert-title">{alert.title}</h2><p id="region-alert-description">{demoMode ? 'Este cenário foi simulado para demonstrar o tratamento de falhas. Consulte as APIs reais para verificar a disponibilidade atual.' : alert.description}</p>
    <div id="region-alert-details" className="alert-details"><strong>{demoMode ? 'Dados de demonstração' : 'Dados das APIs do desafio'}</strong>{issues.length > 0 && <ul>{issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}</div>
    <div className="alert-actions">{demoMode && <button className="button button-dark button-small" onClick={onUseLive}>Consultar APIs reais</button>}<button className={`button ${demoMode ? 'button-outline' : 'button-dark'} button-small`} disabled={!demoMode && kind === 'unavailable' && busy} onClick={onAction}>{alert.action}</button>{!demoMode && kind === 'incomplete' && <button className="button button-outline button-small" disabled={busy} onClick={onRetry}>Tentar novamente</button>}<button className="button button-outline button-small" onClick={onClose}>Fechar</button></div>
  </dialog>;
}
