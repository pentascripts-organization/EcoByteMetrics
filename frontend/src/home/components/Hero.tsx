import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-landscape.png';
import luganoImage from '../assets/hero-lugano.jpg';
import lakesImage from '../assets/hero-lakes.jpg';
import mountainsImage from '../assets/hero-mountains.jpg';
import lagoonImage from '../assets/hero-lagoon.jpg';
import { useCarousel } from '../hooks/useCarousel';
import { MetricOrb } from './MetricOrb';

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
  };
}

const slides = [heroImage, luganoImage, lakesImage, mountainsImage, lagoonImage];

export function Hero({ copy }: HeroProps) {
  const { index, setIndex, previous, next } = useCarousel(slides.length);

  return (
    <section
      className="hero"
      id="inicio"
    >
      {slides.map((image, slideIndex) => (
        <div
          key={image}
          className={`hero__background${slideIndex === index ? ' active' : ''}`}
          style={{ backgroundImage: `url(${image})` } as CSSProperties}
          aria-hidden="true"
        />
      ))}
      <div className="hero__wash" aria-hidden="true">
        <svg viewBox="0 0 1040 445" preserveAspectRatio="none">
          <path d="M0 0H640C632 77 605 159 566 237C528 314 478 388 425 445H0Z" />
        </svg>
      </div>
      <div className="hero__right-shade" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />
      <div className="hero__leaves" aria-hidden="true">
        <span />
        <span />
        <span />
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

      <div className="slide-index" data-label={`${index + 1} / ${slides.length}`} aria-label={`Slide ${index + 1} de ${slides.length}`}>
        <div className="slide-index__rail" aria-hidden="true">
          <span style={{ height: `${100 / slides.length}%`, transform: `translateY(${index * 100}%)` }} />
        </div>
        <div className="slide-index__numbers">
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type="button"
              className={slideIndex === index ? 'active' : ''}
              aria-pressed={slideIndex === index}
              onClick={() => setIndex(slideIndex)}
              aria-label={`Ir para slide ${slideIndex + 1}`}
            >
              {String(slideIndex + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      <div className="hero-arrows" aria-label="Controles do carrossel">
        <button type="button" onClick={previous} aria-label="Slide anterior">
          <ArrowLeft size={15} />
        </button>
        <button type="button" onClick={next} aria-label="Próximo slide">
          <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
