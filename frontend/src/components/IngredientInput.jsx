import { useState } from "react";

const EXAMPLES = [
  "eggs, spinach, feta, half an onion",
  "chicken thighs, rice, soy sauce, ginger",
  "canned chickpeas, tomatoes, garlic, pita",
];

export default function IngredientInput({ onSubmit, disabled }) {
  const [ingredients, setIngredients] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!ingredients.trim() || disabled) return;
    onSubmit(ingredients, notes);
  }

  function fillExample(example) {
    setIngredients(example);
  }

  return (
    <form className="ingredient-form" onSubmit={handleSubmit}>
      <label htmlFor="ingredients">What's in the fridge?</label>
      <textarea
        id="ingredients"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="eggs, half a bell pepper, leftover rice, a lonely carrot..."
        rows={3}
        disabled={disabled}
        maxLength={1000}
      />

      <label htmlFor="notes" className="notes-label">
        Anything else? <span className="optional">(optional — diet, mood, time limit...)</span>
      </label>
      <input
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="vegetarian, under 20 minutes, spicy..."
        disabled={disabled}
        maxLength={200}
      />

      <div className="examples">
        {EXAMPLES.map((ex) => (
          <button
            type="button"
            key={ex}
            className="example-chip"
            onClick={() => fillExample(ex)}
            disabled={disabled}
          >
            {ex}
          </button>
        ))}
      </div>

      <button type="submit" className="raid-button" disabled={disabled || !ingredients.trim()}>
        {disabled ? "Raiding the fridge…" : "Raid the fridge 🧊"}
      </button>
    </form>
  );
}
