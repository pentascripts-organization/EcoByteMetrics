import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Leaf, LockKeyhole, Monitor, MousePointer2, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Panel } from '../components/UI';
import { useSettings } from '../hooks/useSettings';
import type { MonitoringSettings, Period } from '../types/monitoring';

export function SettingsPage() {
  const { settings, saveSettings } = useSettings();
  const [draft, setDraft] = useState<MonitoringSettings>(settings);
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const persisted = saveSettings(draft);
    setMessage(persisted ? 'Preferências salvas neste navegador.' : 'Preferências aplicadas nesta sessão. Não foi possível salvá-las no navegador.');
  };
  return <><div className="page-heading"><div><span className="eyebrow">UMA EXPERIÊNCIA DO SEU JEITO</span><h1>Pequenos ajustes. Mais conforto.</h1><p>Personalize a visualização do EcoByteMetrics neste navegador.</p></div></div>
    <div className="settings-grid"><Panel icon={Settings2} title="Preferências de visualização"><form className="settings-form" onSubmit={submit}><div className="settings-row"><div className="settings-label"><MousePointer2 size={20} /><div><label htmlFor="parallax">Folhas em movimento</label><p>Um toque de natureza que acompanha o seu mouse.</p></div></div><label className="switch"><input id="parallax" type="checkbox" checked={draft.parallaxEnabled} onChange={(event) => { setDraft({ ...draft, parallaxEnabled: event.target.checked }); setMessage(''); }} /><span className="switch-track" /></label></div><div className="settings-row"><div className="settings-label"><Monitor size={20} /><div><label htmlFor="default-period">Período padrão</label><p>O intervalo inicial dos seus indicadores.</p></div></div><select id="default-period" value={draft.defaultPeriod} onChange={(event) => { setDraft({ ...draft, defaultPeriod: event.target.value as Period }); setMessage(''); }}><option value="24h">Últimas 24 horas</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option></select></div><div className="settings-accessibility"><Leaf size={16} /><p>A preferência de movimento reduzido do seu dispositivo sempre será respeitada.</p></div><div className="settings-submit"><button className="button button-dark" type="submit">Salvar preferências<Check size={17} /></button>{message && <p className="form-message" role="status">{message}</p>}</div></form></Panel>
      <aside className="settings-aside"><span className="icon-tile"><LockKeyhole size={22} /></span><h2>Seu ambiente,<br />com acesso seguro.</h2><p>As configurações de monitoramento estarão disponíveis após a integração com a autenticação.</p><Link className="text-link" to="/login">Conhecer a tela de acesso<LockKeyhole size={15} /></Link><span className="settings-aside-note">As preferências desta tela afetam apenas a visualização local.</span></aside>
    </div>
  </>;
}
