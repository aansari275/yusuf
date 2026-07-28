"use client";

import { useState } from "react";
import { JOKES } from "../../lib/yusuf";

/** Tap to hear the punchline, tap again for a fresh joke. */
export default function JokeBox() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const joke = JOKES[index];

  const handleClick = () => {
    if (revealed) {
      setIndex((i) => (i + 1) % JOKES.length);
      setRevealed(false);
    } else {
      setRevealed(true);
    }
  };

  return (
    <div className="sticker p-8 text-center">
      <span className="text-5xl" aria-hidden="true">
        🤡
      </span>
      <h3 className="mt-4 text-2xl font-extrabold sm:text-3xl">{joke.q}</h3>

      <p
        className="mt-4 min-h-[3.5rem] text-xl font-bold text-berry sm:text-2xl"
        aria-live="polite"
      >
        {revealed ? (
          <span key={`${index}-answer`} className="animate-pop-in inline-block">
            {joke.a}
          </span>
        ) : (
          <span className="text-ink-soft">…</span>
        )}
      </p>

      <button
        type="button"
        onClick={handleClick}
        className="toy-button mt-4 bg-grape"
      >
        {revealed ? "Another one! 🔄" : "Tell me! 😆"}
      </button>
    </div>
  );
}
