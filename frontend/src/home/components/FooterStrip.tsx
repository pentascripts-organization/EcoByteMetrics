import type { CSSProperties } from 'react';
const heroImage = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221600%22 height=%22900%22%3E%3Crect width=%221600%22 height=%22900%22 fill=%22%23d6e8df%22/%3E%3C/svg%3E";

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
