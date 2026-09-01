import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { geminiResponseSchema, validateRecipeShape } from "./recipeSchema.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const PORT = process.env.PORT || 3001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REQUEST_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = 3;

const SYSTEM_PROMPT = `You are a recipe generator for a "fridge raid" cooking app.
Given a free-form list of ingredients (and possibly dietary notes or vibes) the
user has on hand, invent ONE realistic recipe that mostly uses what they listed.
You may assume basic pantry staples (salt, pepper, oil, water) are available even
if not listed.

Rules:
- Return ONLY the JSON object described by the schema. No prose, no markdown fences.
- ingredients: 3-12 items. Give realistic amount+unit when the ingredient is
  measurable (unit like "cup", "tbsp", "g", "clove", "whole"). For 2-3 ingredients
  the user seems least likely to have exactly right, populate "swaps" with 1-3
  reasonable substitutes. Leave swaps empty for common items.
- steps: 3-10 steps, each a single clear instruction. Mention concrete durations
  in the instruction text where relevant (e.g. "Simmer for 8 minutes") so the app
  can build a timer from it.
- tips: 0-3 short optional tips (storage, plating, swaps not already covered).
- servings should be a sensible integer for the quantity of ingredients described.`;

app.post("/api/recipe", async (req, res) => {
  const { ingredients, notes } = req.body ?? {};

  if (typeof ingredients !== "string" || ingredients.trim().length === 0) {
    return res.status(400).json({ error: "Tell me what's in your fridge first." });
  }
  if (ingredients.length > 1000) {
    return res.status(400).json({ error: "That's a long fridge. Try trimming it to the essentials." });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Copy server/.env.example to server/.env and add your key.",
    });
  }

  const userPrompt = `Ingredients on hand: ${ingredients.trim()}${
    notes && typeof notes === "string" && notes.trim() ? `\nAdditional notes: ${notes.trim()}` : ""
  }`;

  let lastReason = "Unknown error.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const promptForAttempt =
        attempt === 1
          ? userPrompt
          : `${userPrompt}\n\n(Your previous response was invalid: ${lastReason} Return strictly valid JSON matching the schema this time — no markdown fences, no trailing commas, no missing required fields.)`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: promptForAttempt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: geminiResponseSchema,
              temperature: 0.8,
            },
          }),
        }
      );

      clearTimeout(timeout);

      if (!geminiRes.ok) {
        const body = await geminiRes.text().catch(() => "");
        lastReason = `Model API returned ${geminiRes.status}.`;
        console.error("Gemini API error:", geminiRes.status, body.slice(0, 500));
        // 4xx from a bad request won't get better on retry; only retry 5xx/429.
        if (geminiRes.status < 500 && geminiRes.status !== 429) {
          return res.status(502).json({ error: "The model rejected the request. Try rephrasing your ingredients." });
        }
        continue;
      }

      const payload = await geminiRes.json();
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        lastReason = "Model returned no content (may have been blocked by safety filters).";
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastReason = "Response was not valid JSON.";
        continue;
      }

      const { valid, recipe, reason } = validateRecipeShape(parsed);
      if (!valid) {
        lastReason = reason;
        continue;
      }

      return res.json({ recipe });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === "AbortError") {
        lastReason = "Request timed out.";
      } else {
        lastReason = "Network error reaching the model.";
        console.error("Fetch error:", err);
      }
    }
  }

  return res.status(502).json({
    error: `Couldn't get a usable recipe after ${MAX_ATTEMPTS} tries (${lastReason}). Please try again.`,
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Fridge-to-recipe server listening on http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY not set — /api/recipe will return 500 until you set it in server/.env");
  }
});
