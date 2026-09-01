const MESSAGES = [
  "Digging through the crisper drawer…",
  "Negotiating with the leftover rice…",
  "Consulting the spice rack…",
  "Deciding whether that's still good…",
];

import { useEffect, useState } from "react";

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p>{MESSAGES[messageIndex]}</p>
    </div>
  );
}
