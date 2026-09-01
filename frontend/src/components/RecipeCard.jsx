import ServingScaler from "./ServingScaler.jsx";
import SwapChip from "./SwapChip.jsx";
import { formatAmount, scaleAmount } from "../scaleUtils.js";

export default function RecipeCard({ recipe, displayServings, onServingsChange, onSwapIngredient }) {
  return (
    <div className="recipe-card">
      <header className="recipe-header">
        <h2>{recipe.title}</h2>
        {recipe.description && <p className="recipe-description">{recipe.description}</p>}

        <div className="recipe-meta">
          {recipe.difficulty && <span className="meta-pill">{recipe.difficulty}</span>}
          {recipe.prepTimeMinutes != null && (
            <span className="meta-pill">{recipe.prepTimeMinutes}m prep</span>
          )}
          {recipe.cookTimeMinutes != null && (
            <span className="meta-pill">{recipe.cookTimeMinutes}m cook</span>
          )}
        </div>
      </header>

      <ServingScaler servings={displayServings} onChange={onServingsChange} />

      {/* Block: ingredients */}
      <section className="recipe-block">
        <h3>Ingredients</h3>
        <ul className="ingredient-list">
          {recipe.ingredients.map((ing) => {
            const scaled = scaleAmount(ing.amount, recipe.servings, displayServings);
            const formatted = formatAmount(scaled);
            return (
              <li key={ing.id} className="ingredient-row">
                <span className="ingredient-amount">
                  {formatted != null ? `${formatted}${ing.unit ? " " + ing.unit : ""}` : ""}
                </span>
                <span className="ingredient-name">
                  {ing.name}
                  {ing.notes && <span className="ingredient-notes"> ({ing.notes})</span>}
                </span>
                <SwapChip swaps={ing.swaps} onSwap={(swap) => onSwapIngredient(ing.id, swap)} />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Block: tips — renders independently, degrades gracefully if empty */}
      {recipe.tips.length > 0 && (
        <section className="recipe-block tips-block">
          <h3>Tips</h3>
          <ul className="tips-list">
            {recipe.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
