"use client";

import { useCallback, useState } from "react";

const MAX = 12;

const STAGES = [
  { at: 0, label: "Not silly yet…", emoji: "😐" },
  { at: 3, label: "Getting silly!", emoji: "🙂" },
  { at: 6, label: "Very silly!!", emoji: "😄" },
  { at: 9, label: "SUPER SILLY!!!", emoji: "🤪" },
  { at: MAX, label: "MAXIMUM SILLY!!!!", emoji: "🤯" },
];

type Pop = { id: number; emoji: string; x: number };

const POP_EMOJI = ["⭐", "🎉", "🦖", "🍫", "🚀", "🎈", "😂"];

/** A big friendly button that fills a meter — the whole point is to mash it. */
export default function SillyMeter() {
  const [count, setCount] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);

  const stage = [...STAGES].reverse().find((s) => count >= s.at) ?? STAGES[0];
  const percent = Math.min(100, (count / MAX) * 100);
  const maxed = count >= MAX;

  const handleClick = useCallback(() => {
    setCount((c) => Math.min(MAX, c + 1));

    // Confetti-ish burst that cleans itself up.
    const pop: Pop = {
      id: Date.now() + Math.random(),
      emoji: POP_EMOJI[Math.floor(Math.random() * POP_EMOJI.length)],
      x: 20 + Math.random() * 60,
    };
    setPops((p) => [...p, pop]);
    setTimeout(() => {
      setPops((p) => p.filter((item) => item.id !== pop.id));
    }, 900);
  }, []);

  return (
    <div className="sticker relative overflow-hidden p-8 text-center">
      {/* Emoji bursts */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {pops.map((pop) => (
          <span
            key={pop.id}
            className="animate-bob absolute bottom-24 text-3xl"
            style={{ left: `${pop.x}%` }}
          >
            {pop.emoji}
          </span>
        ))}
      </div>

      <h3 className="text-2xl font-extrabold sm:text-3xl">The Silly-o-Meter 🎛️</h3>
      <p className="mt-2 text-ink-soft">Press the button as many times as you like!</p>

      {/* Meter */}
      <div className="mx-auto mt-6 h-8 w-full max-w-md overflow-hidden rounded-full bg-paper-deep">
        <div
          className="h-full rounded-full bg-gradient-to-r from-mint via-sun to-berry transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={MAX}
          aria-label="Silliness level"
        />
      </div>

      <p className="mt-4 text-2xl font-extrabold" aria-live="polite">
        <span className={maxed ? "animate-wiggle inline-block text-4xl" : "text-4xl"}>
          {stage.emoji}
        </span>{" "}
        <span className="align-middle">{stage.label}</span>
      </p>

      <button
        type="button"
        onClick={handleClick}
        className="toy-button mt-5 bg-berry text-xl"
      >
        {maxed ? "🎉 You did it! 🎉" : "Make me sillier! 🤪"}
      </button>

      {maxed && (
        <button
          type="button"
          onClick={() => setCount(0)}
          className="mt-4 block w-full text-sm font-bold text-ink-soft underline"
        >
          Start again
        </button>
      )}
    </div>
  );
}
