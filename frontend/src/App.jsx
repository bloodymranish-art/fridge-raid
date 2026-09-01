import { useEffect, useMemo, useState } from "react";
import IngredientInput from "./components/IngredientInput.jsx";
import LoadingState from "./components/LoadingState.jsx";
import ErrorState from "./components/ErrorState.jsx";
import RecipeCard from "./components/RecipeCard.jsx";
import StepChecklist from "./components/StepChecklist.jsx";
import CookMode from "./components/CookMode.jsx";
import { useRecipeGenerator } from "./hooks/useRecipeGenerator.js";

export default function App() {
  const { status, recipe, error, generate, reset } = useRecipeGenerator();
  const [lastSubmission, setLastSubmission] = useState(null);
  const [displayServings, setDisplayServings] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const [swappedIngredients, setSwappedIngredients] = useState({});

  useEffect(() => {
    if (recipe) {
      setDisplayServings(recipe.servings);
      setCheckedSteps(new Set());
      setSwappedIngredients({});
    }
  }, [recipe]);

  function handleSubmit(ingredients, notes) {
    setLastSubmission({ ingredients, notes });
    generate(ingredients, notes);
  }

  function handleRetry() {
    if (lastSubmission) generate(lastSubmission.ingredients, lastSubmission.notes);
  }

  function toggleStep(stepId) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      next.has(stepId) ? next.delete(stepId) : next.add(stepId);
      return next;
    });
  }

  function swapIngredient(ingredientId, newName) {
    setSwappedIngredients((prev) => ({ ...prev, [ingredientId]: newName }));
  }

  const displayedRecipe = useMemo(() => {
    if (!recipe) return null;
    if (Object.keys(swappedIngredients).length === 0) return recipe;
    return {
      ...recipe,
      ingredients: recipe.ingredients.map((ing) =>
        swappedIngredients[ing.id] ? { ...ing, name: swappedIngredients[ing.id], swaps: [] } : ing
      ),
    };
  }, [recipe, swappedIngredients]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Fridge Raid 🧊</h1>
        <p className="tagline">Turn what's on hand into a recipe you can actually cook from.</p>
      </header>

      <main>
        <IngredientInput onSubmit={handleSubmit} disabled={status === "loading"} />

        {status === "loading" && <LoadingState />}

        {status === "error" && <ErrorState message={error} onRetry={handleRetry} />}

        {status === "success" && displayedRecipe && (
          <>
            <RecipeCard
              recipe={displayedRecipe}
              displayServings={displayServings}
              onServingsChange={setDisplayServings}
              onSwapIngredient={swapIngredient}
            />
            <StepChecklist
              steps={displayedRecipe.steps}
              checkedSteps={checkedSteps}
              onToggle={toggleStep}
              onEnterCookMode={() => setCookModeOpen(true)}
            />
            <button type="button" className="start-over-button" onClick={reset}>
              Raid the fridge again
            </button>
          </>
        )}

        {status === "idle" && (
          <div className="empty-state">
            <p>No recipe yet — list what you've got above and I'll build one around it.</p>
          </div>
        )}
      </main>

      {cookModeOpen && displayedRecipe && (
        <CookMode steps={displayedRecipe.steps} onClose={() => setCookModeOpen(false)} />
      )}
    </div>
  );
}
