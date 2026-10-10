import { ArrowRight, Leaf, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';

export function NotFoundPage() {
  return <main className="not-found-page nature-error"><Brand /><div className="error-mountains" aria-hidden="true"><span /><span /><span /></div><section className="error-card"><span className="pill-label">Falha na navegação</span><div className="error-number" aria-hidden="true">4<Leaf size={88} strokeWidth={1.5} />4</div><span className="eyebrow">404 · UM PEQUENO DESVIO</span><h1>Página não encontrada</h1><p>O endereço solicitado não existe ou foi movido. Volte ao início para continuar consultando dados de CO₂.</p><div className="alert-actions"><Link className="button button-dark" to="/">Voltar ao início<ArrowRight size={17} /></Link><button className="button button-outline" onClick={() => window.location.reload()}><RotateCcw size={16} />Tentar novamente</button></div></section></main>;
}
