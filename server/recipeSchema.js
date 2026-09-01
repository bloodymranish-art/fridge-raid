// The schema we hand to Gemini's `responseSchema` (constrains generation),
// and a validator we run ourselves on whatever comes back — "the model was
// told to follow a schema" is not the same guarantee as "it did."

export const geminiResponseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    servings: { type: "integer" },
    prepTimeMinutes: { type: "integer" },
    cookTimeMinutes: { type: "integer" },
    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "number" },
          unit: { type: "string" },
          notes: { type: "string" },
          swaps: { type: "array", items: { type: "string" } },
        },
        required: ["name"],
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          order: { type: "integer" },
          instruction: { type: "string" },
        },
        required: ["order", "instruction"],
      },
    },
    tips: { type: "array", items: { type: "string" } },
  },
  required: ["title", "servings", "ingredients", "steps"],
};

/**
 * Validates the *shape* the frontend actually depends on. Deliberately
 * stricter in some ways than the Gemini schema above (e.g. non-empty
 * ingredients/steps arrays, no negative servings) since the schema only
 * constrains generation — it doesn't guarantee the model didn't return an
 * empty array or nonsense numbers.
 *
 * Returns { valid: true, recipe: <sanitized> } or { valid: false, reason }.
 */
export function validateRecipeShape(raw) {
  if (!raw || typeof raw !== "object") {
    return { valid: false, reason: "Response was not a JSON object." };
  }

  if (typeof raw.title !== "string" || raw.title.trim().length === 0) {
    return { valid: false, reason: "Missing or empty title." };
  }

  if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) {
    return { valid: false, reason: "Missing or empty ingredients list." };
  }

  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    return { valid: false, reason: "Missing or empty steps list." };
  }

  const badIngredient = raw.ingredients.find(
    (ing) => !ing || typeof ing.name !== "string" || ing.name.trim().length === 0
  );
  if (badIngredient) {
    return { valid: false, reason: "An ingredient is missing a name." };
  }

  const badStep = raw.steps.find(
    (s) => !s || typeof s.instruction !== "string" || s.instruction.trim().length === 0
  );
  if (badStep) {
    return { valid: false, reason: "A step is missing instruction text." };
  }

  // Sanitize / coerce into a shape the frontend can trust blindly.
  const recipe = {
    title: raw.title.trim(),
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    servings: Number.isFinite(raw.servings) && raw.servings > 0 ? Math.round(raw.servings) : 4,
    prepTimeMinutes: Number.isFinite(raw.prepTimeMinutes) ? Math.max(0, Math.round(raw.prepTimeMinutes)) : null,
    cookTimeMinutes: Number.isFinite(raw.cookTimeMinutes) ? Math.max(0, Math.round(raw.cookTimeMinutes)) : null,
    difficulty: ["easy", "medium", "hard"].includes(raw.difficulty) ? raw.difficulty : null,
    ingredients: raw.ingredients.map((ing, i) => ({
      id: `ing-${i}`,
      name: ing.name.trim(),
      amount: Number.isFinite(ing.amount) && ing.amount > 0 ? ing.amount : null,
      unit: typeof ing.unit === "string" && ing.unit.trim() ? ing.unit.trim() : null,
      notes: typeof ing.notes === "string" && ing.notes.trim() ? ing.notes.trim() : null,
      swaps: Array.isArray(ing.swaps)
        ? ing.swaps.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim())
        : [],
    })),
    steps: raw.steps
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s, i) => ({
        id: `step-${i}`,
        order: i + 1,
        instruction: s.instruction.trim(),
      })),
    tips: Array.isArray(raw.tips)
      ? raw.tips.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim())
      : [],
  };

  return { valid: true, recipe };
}
