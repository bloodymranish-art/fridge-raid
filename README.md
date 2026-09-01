# Fridge Raid 🧊 → 🍳

Type out whatever's in your fridge (or pantry, or "half an onion and regret"),
and get back an actual interactive recipe — not a wall of chat text. Scale
servings live, swap ingredients you don't have, and check off steps as you
cook.

**Live idea in one line:** the AI doesn't talk to you, it hands your React app
a structured recipe object, and the UI turns that object into something you
can actually cook from.

## What makes this one different

Most "AI recipe" demos are a chat box that prints markdown. This one treats
the model's output as **data with a shape**, and the whole UI is built around
that shape being unreliable:

- **Live serving scaler** — drag a slider, every ingredient amount
  recalculates in real time (fractions included: "1/2 cup" scales cleanly).
- **Inline ingredient swaps** — each ingredient the model isn't fully
  confident about ships with alternates; tap one to swap it into the recipe
  card without regenerating anything.
- **Cook Mode** — a full-screen step-through view with a running timer for
  any step that mentions a duration ("simmer 8 minutes" gets an actual
  countdown), so it works one-handed at the stove.
- **Three renderable block types** (ingredients, steps, tips) so different
  parts of the response can degrade independently — if `tips` comes back
  empty or malformed, the card and checklist still render fine.
- **Race-condition safe**: if you edit your ingredient list and hit generate
  again before the first request lands, the stale response is discarded, not
  rendered over the fresh one.

## Stack

- **Frontend:** React 18 + Vite, no UI framework — hand-rolled CSS (kitchen
  counter / recipe-card aesthetic, see `frontend/src/index.css`).
- **Backend:** Node + Express, single `/api/recipe` route. This is the only
  thing that talks to Gemini — the API key never reaches the browser.
- **Model:** Google Gemini (`gemini-2.0-flash`), called with
  `responseMimeType: application/json` and an explicit `responseSchema` so
  the model is constrained to a JSON shape, not just asked nicely for one.

## Project structure

```
fridge-to-recipe/
├── server/              Express backend (Gemini proxy + validation)
│   ├── index.js
│   ├── recipeSchema.js  Shared JSON schema + validator
│   ├── package.json
│   └── .env.example
└── frontend/             React app
    ├── src/
    │   ├── App.jsx
    │   ├── hooks/useRecipeGenerator.js   fetch + abort + staleness guard
    │   └── components/    RecipeCard, StepChecklist, ServingScaler,
    │                       SwapChip, CookMode, LoadingState, ErrorState
    └── package.json
```

## Setup

You need a free Gemini API key: https://aistudio.google.com/app/apikey

```bash
# 1. Backend
cd server
cp .env.example .env
# paste your key into .env as GEMINI_API_KEY=...
npm install
npm start          # runs on http://localhost:3001

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev         # runs on http://localhost:5173, proxies /api to :3001
```

`npm install && npm start` works for the backend; the frontend follows the
standard `npm install && npm run dev` (Vite's equivalent of `npm start`) —
noted here since the assignment brief mentions `npm start` specifically and
this repo has two `package.json`s.

## AI-usage note

I used Claude to help scaffold this (project structure, the Express proxy
boilerplate, and a first pass at the fraction-scaling math for the serving
scaler), and iterated on it — the retry/validation logic in
`server/index.js`, the block-based rendering split, and the Cook Mode timer
behavior are things I rewrote after Claude's first pass didn't handle stale
requests / malformed JSON the way I wanted. I read and can explain every file
here; nothing is unmodified AI output I don't understand.

## Known limitations

- Serving scaler assumes ingredient amounts are numeric or simple fractions
  ("1/2", "3/4"); it won't scale free-text amounts like "a splash" or "to
  taste" — those are left as-is by design rather than guessed at.
- Cook Mode's step timers are parsed from the instruction text with a simple
  regex (`\d+\s*(minute|min)`); steps that describe duration unusually
  ("until golden, about ten minutes") won't get an automatic timer.
- No auth, no persistence — nothing is saved between page reloads. Session
  save/reload was a stretch goal I didn't get to.
- Streaming isn't implemented; the request/response is a single round trip
  with a loading state, not a token-by-token stream.
- Only tested against Gemini's free tier; the schema-constrained JSON
  approach should port to OpenAI/Groq's structured-output modes with a
  swapped request shape in `server/index.js`, but I haven't wired that up.

## What I'd do next with more time

- Session save/reload (localStorage would be enough for a v1).
- A refinement loop ("swap out the chicken for tofu") that patches the
  existing recipe object instead of regenerating the whole thing.
- Nutrition estimate as a fourth block type, to exercise the "different
  block kinds" idea further.

## Time spent

~8 hours, per the brief's target.
