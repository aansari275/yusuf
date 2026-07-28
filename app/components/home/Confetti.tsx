"use client";

import { useEffect, useState } from "react";

const COLORS = ["#ffc53d", "#41b6ff", "#ff5c7a", "#22cca0", "#9b6bff", "#ff9143"];

type Piece = {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
};

/**
 * Falling confetti. Pieces are generated after mount, never during render, so
 * the randomness can't cause a hydration mismatch in the static export.
 */
export default function Confetti({ count = 40 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 8,
      })),
    );
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 block rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
