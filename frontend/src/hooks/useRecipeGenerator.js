import { useCallback, useRef, useState } from "react";

/**
 * Wraps the /api/recipe call with:
 *  - an AbortController per request, so leaving the page or firing a new
 *    request cancels the in-flight one instead of leaking it
 *  - a monotonically increasing request id, so if request #1 is still in
 *    flight when request #2 resolves first, request #1's late response is
 *    discarded instead of clobbering the newer result on screen
 */
export function useRecipeGenerator() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);

  const latestRequestId = useRef(0);
  const abortRef = useRef(null);

  const generate = useCallback(async (ingredients, notes) => {
    const requestId = ++latestRequestId.current;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, notes }),
        signal: controller.signal,
      });

      const isStale = requestId !== latestRequestId.current;

      let body;
      try {
        body = await res.json();
      } catch {
        if (!isStale) {
          setStatus("error");
          setError("The server sent back something that wasn't valid JSON. Please try again.");
        }
        return;
      }

      if (isStale) return; // a newer request has already started/finished — drop this one silently

      if (!res.ok) {
        setStatus("error");
        setError(body?.error || `Something went wrong (${res.status}).`);
        return;
      }

      setRecipe(body.recipe);
      setStatus("success");
    } catch (err) {
      if (err.name === "AbortError") return; // superseded by a newer request, not a real failure
      if (requestId !== latestRequestId.current) return;
      setStatus("error");
      setError("Couldn't reach the server. Is it running on :3001?");
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setStatus("idle");
    setRecipe(null);
    setError(null);
  }, []);

  return { status, recipe, error, generate, reset };
}
