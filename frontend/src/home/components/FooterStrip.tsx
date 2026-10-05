import type { CSSProperties } from 'react';
import heroImage from '../assets/hero-landscape.png';

interface FooterStripProps {
  phrase: string;
  linkLabel: string;
}

export function FooterStrip({ phrase, linkLabel }: FooterStripProps) {
  return (
    <footer
      className="footer-strip"
      id="projeto"
      style={{ '--footer-image': `url(${heroImage})` } as CSSProperties}
    >
      <div className="footer-strip__left">
        <span className="footer-strip__line" aria-hidden="true" />
        <span>{phrase}</span>
      </div>
      <div className="footer-strip__right">
        <span className="footer-strip__line" aria-hidden="true" />
        <a href="https://github.com/pentascripts-organization/EcoByteMetrics">{linkLabel}</a>
      </div>
    </footer>
  );
}
