import { useState } from "react";

export default function SwapChip({ swaps, onSwap }) {
  const [open, setOpen] = useState(false);

  if (!swaps || swaps.length === 0) return null;

  return (
    <div className="swap-wrapper">
      <button
        type="button"
        className="swap-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        swap ▾
      </button>
      {open && (
        <div className="swap-menu">
          {swaps.map((swap) => (
            <button
              type="button"
              key={swap}
              className="swap-option"
              onClick={() => {
                onSwap(swap);
                setOpen(false);
              }}
            >
              {swap}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
