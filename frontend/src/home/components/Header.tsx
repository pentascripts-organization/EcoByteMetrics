import { useEffect, useState } from 'react';
import { ArrowUpRight, Globe2, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Locale } from '../data/content';
import { Brand } from './Brand';

interface HeaderProps {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  labels: {
    home: string;
    solutions: string;
    data: string;
    about: string;
    access: string;
    login: string;
    language: string;
    menu: string;
  };
}

export function Header({ locale, onLocaleChange, labels }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const links = [
    [labels.home, '#inicio'],
    [labels.solutions, '#solucoes'],
    [labels.data, '#dados'],
    [labels.about, '#projeto'],
  ] as const;

  return (
    <header className="site-header" aria-label="Cabeçalho principal">
      <Brand />

      <nav className="desktop-nav" aria-label="Navegação principal">
        {links.map(([label, href], index) => (
          <a key={href} className={index === 0 ? 'active' : ''} href={href}>
            {label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <Link className="platform-link" to="/dashboard">
          <span>{labels.access}</span>
          <ArrowUpRight size={13} strokeWidth={1.7} aria-hidden="true" />
        </Link>

        <label className="language">
          <Globe2 size={18} aria-hidden="true" />
          <select aria-label={labels.language} value={locale}
            onChange={(event) => onLocaleChange(event.target.value as Locale)}>
            <option value="pt">PT</option>
            <option value="en">EN</option>
          </select>
        </label>

        <button
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={labels.menu}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="mobile-nav" id="mobile-navigation" aria-label="Navegação móvel">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)}>{labels.login}</Link>
          <Link className="mobile-nav__cta" to="/dashboard" onClick={() => setMenuOpen(false)}>
            {labels.access}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      )}
    </header>
  );
}
