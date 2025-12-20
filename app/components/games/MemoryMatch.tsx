"use client";

import { useState, useEffect } from "react";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const emojiSets = [
  ["🐶", "🐱", "🐼", "🦁", "🐸", "🐵"], // Level 1
  ["🍎", "🍊", "🍋", "🍇", "🍓", "🍌", "🍉", "🍒"], // Level 2
  ["🚗", "🚀", "✈️", "🚂", "🚁", "⛵", "🏎️", "🛸", "🚲", "🛴"], // Level 3
  ["⭐", "🌙", "☀️", "🌈", "❄️", "🔥", "💎", "👑", "🎯", "🎪", "🎨", "🎭"], // Level 4
];

export default function MemoryMatch() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "victory">("menu");
  const [level, setLevel] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [bestMoves, setBestMoves] = useState<number[]>([999, 999, 999, 999]);
  const [isLocked, setIsLocked] = useState(false);
  const [timer, setTimer] = useState(0);

  const startGame = (levelIdx: number = 0) => {
    setLevel(levelIdx);
    setGameState("playing");
    setMoves(0);
    setMatches(0);
    setFlippedCards([]);
    setTimer(0);

    const emojis = emojiSets[levelIdx];
    const pairs = [...emojis, ...emojis];
    const shuffled = pairs.sort(() => Math.random() - 0.5);

    setCards(shuffled.map((emoji, idx) => ({
      id: idx,
      emoji,
      isFlipped: false,
      isMatched: false,
    })));
  };

  const flipCard = (id: number) => {
    if (isLocked || flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedCards(prev => [...prev, id]);
  };

  useEffect(() => {
    if (flippedCards.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = flippedCards;
      const card1 = cards.find(c => c.id === first);
      const card2 = cards.find(c => c.id === second);

      if (card1?.emoji === card2?.emoji) {
        // Match found!
        setCards(prev => prev.map(c =>
          c.id === first || c.id === second ? { ...c, isMatched: true } : c
        ));
        setMatches(m => m + 1);
        setFlippedCards([]);
      } else {
        // No match
        setIsLocked(true);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    const totalPairs = emojiSets[level]?.length || 0;
    if (matches === totalPairs && matches > 0) {
      setBestMoves(prev => {
        const newBest = [...prev];
        newBest[level] = Math.min(newBest[level], moves);
        return newBest;
      });

      if (level < emojiSets.length - 1) {
        // Next level
        setTimeout(() => startGame(level + 1), 1500);
      } else {
        setGameState("victory");
      }
    }
  }, [matches, level, moves]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getGridCols = () => {
    const count = cards.length;
    if (count <= 12) return 4;
    if (count <= 16) return 4;
    if (count <= 20) return 5;
    return 6;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[350px] mb-4 text-white">
        <div className="text-lg">🎯 Moves: <span className="font-bold text-yellow-400">{moves}</span></div>
        <div className="text-lg">⏱️ Time: <span className="font-bold text-cyan-400">{formatTime(timer)}</span></div>
        <div className="text-lg">⭐ Level: <span className="font-bold text-green-400">{level + 1}</span></div>
      </div>

      <div
        className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-4"
        style={{ width: 350, minHeight: 400 }}
      >
        {gameState === "playing" ? (
          <>
            {/* Progress */}
            <div className="mb-4 text-center">
              <span className="text-white font-bold">
                Matches: {matches}/{emojiSets[level].length}
              </span>
              {bestMoves[level] < 999 && (
                <span className="text-yellow-300 ml-4 text-sm">
                  Best: {bestMoves[level]} moves
                </span>
              )}
            </div>

            {/* Cards Grid */}
            <div
              className="grid gap-2 justify-center"
              style={{ gridTemplateColumns: `repeat(${getGridCols()}, minmax(0, 1fr))` }}
            >
              {cards.map(card => (
                <button
                  key={card.id}
                  onClick={() => flipCard(card.id)}
                  className={`aspect-square rounded-lg text-2xl md:text-3xl flex items-center justify-center transition-all duration-300 transform ${
                    card.isFlipped || card.isMatched
                      ? "bg-white rotate-0 scale-100"
                      : "bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-105 cursor-pointer"
                  } ${card.isMatched ? "opacity-70 scale-95" : ""}`}
                  disabled={card.isFlipped || card.isMatched || isLocked}
                  style={{
                    minWidth: 45,
                    minHeight: 45,
                  }}
                >
                  {card.isFlipped || card.isMatched ? card.emoji : "❓"}
                </button>
              ))}
            </div>
          </>
        ) : gameState === "menu" ? (
          <div className="flex flex-col items-center justify-center h-80 text-white">
            <div className="text-6xl mb-4 animate-bounce">🧠</div>
            <h2 className="text-3xl font-black mb-2">MEMORY MATCH</h2>
            <p className="mb-4 text-gray-300 text-center">Find all the matching pairs!</p>
            <p className="text-sm mb-6">4 levels of increasing difficulty</p>
            <button
              onClick={() => startGame(0)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              🎮 PLAY
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-white">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-black mb-2 text-yellow-400">YOU WIN!</h2>
            <p className="text-xl mb-2">Time: {formatTime(timer)}</p>
            <p className="text-lg mb-4">Total Moves: {moves}</p>
            <button
              onClick={() => startGame(0)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 rounded-full font-bold text-xl hover:scale-105 transition-transform"
            >
              🔄 PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
