import { useEffect } from 'react';
import { ProjectOverview } from './components/ProjectOverview';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { content } from './data/content';
import './styles.css';

export function Home() {
  const copy = content.pt;

  useEffect(() => {
    document.documentElement.lang = 'pt-BR';
    return () => { document.documentElement.lang = 'pt-BR'; };
  }, []);

  return (
    <div className="ecobyte-home site-shell">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <Header labels={copy.nav} />
      <main id="conteudo" tabIndex={-1}>
        <Hero copy={copy.hero} />
        <Solutions copy={copy.solutions} />
        <ProjectOverview />
      </main>
    </div>
  );
}
