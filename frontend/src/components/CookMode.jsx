import { useEffect, useRef, useState } from "react";

const DURATION_REGEX = /(\d+)\s*(?:-|to)?\s*\d*\s*(minute|min)\b/i;

function parseDurationSeconds(instruction) {
  const match = instruction.match(DURATION_REGEX);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) return null;
  return minutes * 60;
}

export default function CookMode({ steps, onClose }) {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef(null);

  const step = steps[index];
  const totalDuration = step ? parseDurationSeconds(step.instruction) : null;

  useEffect(() => {
    setSecondsLeft(totalDuration);
    setTimerRunning(false);
    clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!timerRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setTimerRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  if (!step) return null;

  return (
    <div className="cook-mode-overlay" role="dialog" aria-modal="true">
      <div className="cook-mode-card">
        <button type="button" className="cook-mode-close" onClick={onClose} aria-label="Exit cook mode">
          ✕
        </button>

        <p className="cook-mode-progress">
          Step {index + 1} of {steps.length}
        </p>
        <p className="cook-mode-instruction">{step.instruction}</p>

        {totalDuration != null && (
          <div className="cook-mode-timer">
            <span className="timer-display">{formatTime(secondsLeft ?? totalDuration)}</span>
            <div className="timer-buttons">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                disabled={secondsLeft === 0}
              >
                {timerRunning ? "Pause" : secondsLeft === totalDuration || secondsLeft == null ? "Start timer" : "Resume"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(totalDuration);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="cook-mode-nav">
          <button type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            ← Back
          </button>
          {index < steps.length - 1 ? (
            <button type="button" className="primary" onClick={() => setIndex((i) => i + 1)}>
              Next →
            </button>
          ) : (
            <button type="button" className="primary" onClick={onClose}>
              Done 🎉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
