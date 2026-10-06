import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';

export function NotFoundPage() {
  return <div className="not-found-page"><Brand /><Compass size={70} strokeWidth={1} /><span className="eyebrow">404 · UM PEQUENO DESVIO</span><h1>Vamos encontrar<br />um novo caminho.</h1><p>A página que você procura não foi encontrada.</p><Link className="button button-dark" to="/"><ArrowLeft size={17} />Voltar ao início</Link></div>;
}
