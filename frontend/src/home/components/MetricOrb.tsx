interface MetricOrbProps {
  label: string;
  value: string;
  unit: string;
  change: string;
  changeCaption: string;
  note: string;
  formula: string;
}

export function MetricOrb({
  label,
  value,
  unit,
  change,
  changeCaption,
  note,
  formula,
}: MetricOrbProps) {
  return (
    <div className="metric-layout" id="dados">
      <div className="metric-orb" aria-label={`${label} ${value} ${unit}`}>
        <svg className="metric-orb__rings" viewBox="0 0 210 210" aria-hidden="true">
          <circle className="metric-orb__outer" cx="105" cy="105" r="91" />
          <circle className="metric-orb__track" cx="105" cy="105" r="62" />
          <circle className="metric-orb__progress" cx="105" cy="105" r="62" />
          <line x1="105" y1="6" x2="105" y2="12" className="metric-orb__tick" />
        </svg>
        <div className="metric-orb__value">
          <span className="metric-orb__label">{label}</span>
          <strong>{value}</strong>
          <span className="metric-orb__unit">{unit}</span>
        </div>
      </div>

      <div className="metric-copy">
        <div className="metric-copy__change">{change}</div>
        <div className="metric-copy__caption">{changeCaption}</div>

        <div className="metric-formula">{formula}</div>

        <p>{note}</p>
      </div>
    </div>
  );
}
