export default function StepChecklist({ steps, checkedSteps, onToggle, onEnterCookMode }) {
  const doneCount = checkedSteps.size;

  return (
    <section className="recipe-block steps-block">
      <div className="steps-header">
        <h3>
          Steps <span className="steps-progress">{doneCount}/{steps.length}</span>
        </h3>
        <button type="button" className="cook-mode-button" onClick={onEnterCookMode}>
          Cook Mode 👨‍🍳
        </button>
      </div>
      <ol className="step-list">
        {steps.map((step) => {
          const checked = checkedSteps.has(step.id);
          return (
            <li key={step.id} className={checked ? "step-row checked" : "step-row"}>
              <label>
                <input type="checkbox" checked={checked} onChange={() => onToggle(step.id)} />
                <span>{step.instruction}</span>
              </label>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
