export default function ServingScaler({ servings, onChange, min = 1, max = 12 }) {
  return (
    <div className="serving-scaler">
      <span className="serving-label">Servings</span>
      <button
        type="button"
        className="stepper-button"
        onClick={() => onChange(Math.max(min, servings - 1))}
        aria-label="Decrease servings"
      >
        −
      </button>
      <input
        type="range"
        min={min}
        max={max}
        value={servings}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Servings slider"
      />
      <button
        type="button"
        className="stepper-button"
        onClick={() => onChange(Math.min(max, servings + 1))}
        aria-label="Increase servings"
      >
        +
      </button>
      <span className="serving-count">{servings}</span>
    </div>
  );
}
