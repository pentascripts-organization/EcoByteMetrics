import { useEffect, useState } from 'react';
import { FooterStrip } from './components/FooterStrip';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { content, type Locale } from './data/content';
import './styles.css';

export function Home() {
  const [locale, setLocale] = useState<Locale>('pt');
  const copy = content[locale];

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
    return () => { document.documentElement.lang = 'pt-BR'; };
  }, [locale]);

  return (
    <div className="ecobyte-home site-shell">
      <a className="skip-link" href="#conteudo">{locale === 'pt' ? 'Pular para o conteúdo' : 'Skip to content'}</a>
      <Header locale={locale} onLocaleChange={setLocale} labels={copy.nav} />
      <main id="conteudo" tabIndex={-1}>
        <Hero copy={copy.hero} />
        <Solutions copy={copy.solutions} />
      </main>
      <FooterStrip phrase={copy.footer.phrase} linkLabel={copy.footer.linkLabel} />
    </div>
  );
}
