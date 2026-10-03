import { Link } from 'react-router-dom';

export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`brand${light ? ' brand-light' : ''}`} to="/" aria-label="EcoByteMetrics, início">
    <img src="/assets/logo.png" width="44" height="40" alt="" />
    <span>EcoByte<span>Metrics</span></span>
  </Link>;
}
