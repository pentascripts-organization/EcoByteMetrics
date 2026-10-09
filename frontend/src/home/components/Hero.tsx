import type { CSSProperties } from 'react';
import { useState, useSyncExternalStore } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-background.png';
import leavesImage from '../assets/hero-leaves.png';
import { useParallax } from '../../hooks/useParallax';
import { useSettings } from '../../hooks/useSettings';
import { MetricOrb } from './MetricOrb';

function subscribeMotionPreference(onChange: () => void) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

interface HeroProps {
  copy: {
    eyebrow: string;
    line1: string;
    line2: string;
    line3: string;
    description: string;
    primary: string;
    secondary: string;
    metricLabel: string;
    metricValue: string;
    metricUnit: string;
    change: string;
    changeCaption: string;
    metricNote: string;
    metricFormula: string;
    motionPaused: string;
    motionReduced: string;
    enableMotion: string;
    motionActive: string;
    pauseMotion: string;
  };
}

export function Hero({ copy }: HeroProps) {
  const { settings } = useSettings();
  const [motionOverride, setMotionOverride] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getReducedMotion, () => false);
  const leavesRef = useParallax(settings.parallaxEnabled || motionOverride, motionOverride);
  return (
    <section
      className="hero"
      id="inicio"
    >
      <div className="hero__background" style={{ backgroundImage: `url(${heroImage})` } as CSSProperties} aria-hidden="true" />
      <div className="hero__wash" aria-hidden="true">
        <svg viewBox="0 0 1040 445" preserveAspectRatio="none">
          <path d="M0 0H640C632 77 605 159 566 237C528 314 478 388 425 445H0Z" />
        </svg>
      </div>
      <div className="hero__right-shade" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />
      <div ref={leavesRef} className={`home-leaves${motionOverride ? ' home-leaves--manual' : ''}`} aria-hidden="true">
        <img className="home-leaves__image" src={leavesImage} alt="" draggable={false} />
      </div>

      <div className="hero__content">
        <div className="hero-copy">
          <div className="hero-copy__eyebrow">{copy.eyebrow}</div>
          <h1>
            <span>{copy.line1}</span>
            <span>{copy.line2}</span>
            <span className="accent">{copy.line3}</span>
          </h1>
          <p>{copy.description}</p>
          <div className="hero-copy__actions">
            <Link className="primary-cta" to="/dashboard">
              <span>{copy.primary}</span>
              <ArrowRight size={15} strokeWidth={1.65} />
            </Link>
            <a className="secondary-cta" href="#dados">
              <span>{copy.secondary}</span>
              <ArrowRight size={14} strokeWidth={1.65} />
            </a>
          </div>
        </div>

        <MetricOrb
          label={copy.metricLabel}
          value={copy.metricValue}
          unit={copy.metricUnit}
          change={copy.change}
          changeCaption={copy.changeCaption}
          note={copy.metricNote}
          formula={copy.metricFormula}
        />
      </div>

      {(motionOverride || !settings.parallaxEnabled || reducedMotion) && (
        <div className="home-motion-control">
          <span>{motionOverride ? copy.motionActive : reducedMotion ? copy.motionReduced : copy.motionPaused}</span>
          <button type="button" onClick={() => setMotionOverride(value => !value)}>
            {motionOverride ? copy.pauseMotion : copy.enableMotion}
          </button>
        </div>
      )}

    </section>
  );
}
