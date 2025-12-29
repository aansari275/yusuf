"use client";

import { useState } from "react";
import Link from "next/link";
import RacingGame from "../components/games/RacingGame";
import SpaceShooter from "../components/games/SpaceShooter";
import FlappyBird from "../components/games/FlappyBird";
import BoxingGame from "../components/games/BoxingGame";
import DinoRunner from "../components/games/DinoRunner";
import BalloonPop from "../components/games/BalloonPop";
import CandyCatch from "../components/games/CandyCatch";
import MemoryMatch from "../components/games/MemoryMatch";
import SnakeGame from "../components/games/SnakeGame";
import BrickBreaker from "../components/games/BrickBreaker";
import DinosaurLand from "../components/games/DinosaurLand";

const games = [
  { id: "racing", name: "🏎️ Speed Racer", description: "Dodge cars and go fast!", color: "from-red-500 to-orange-500", component: RacingGame },
  { id: "shooter", name: "🚀 Space Blaster", description: "Shoot the aliens!", color: "from-purple-500 to-blue-500", component: SpaceShooter },
  { id: "flappy", name: "🐦 Flappy Yusuf", description: "Fly through the pipes!", color: "from-green-500 to-teal-500", component: FlappyBird },
  { id: "boxing", name: "🥊 Punch Master", description: "Knock them out!", color: "from-red-600 to-pink-500", component: BoxingGame },
  { id: "dino", name: "🦖 Dino Jump", description: "Jump over cacti!", color: "from-amber-500 to-yellow-500", component: DinoRunner },
  { id: "balloon", name: "🎈 Balloon Pop", description: "Pop all the balloons!", color: "from-pink-500 to-purple-500", component: BalloonPop },
  { id: "candy", name: "🍬 Candy Catch", description: "Catch the yummy candy!", color: "from-yellow-400 to-orange-500", component: CandyCatch },
  { id: "memory", name: "🧠 Memory Match", description: "Match the pairs!", color: "from-indigo-500 to-purple-500", component: MemoryMatch },
  { id: "snake", name: "🐍 Snake Feast", description: "Eat and grow longer!", color: "from-green-600 to-lime-500", component: SnakeGame },
  { id: "brick", name: "🧱 Brick Breaker", description: "Break all the bricks!", color: "from-blue-500 to-cyan-500", component: BrickBreaker },
  { id: "dinosaur", name: "🦖 Dinosaur Land", description: "Survive the dino attack!", color: "from-green-600 to-amber-500", component: DinosaurLand },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const ActiveGameComponent = games.find(g => g.id === activeGame)?.component;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Stars Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white hover:text-yellow-300 transition-colors flex items-center gap-2">
            <span className="text-2xl">👈</span>
            <span className="font-bold">Back Home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            <span className="text-yellow-400">🎮</span> Yusuf&apos;s Arcade <span className="text-yellow-400">🎮</span>
          </h1>
          <div className="w-24"></div>
        </div>
      </header>

      {activeGame && ActiveGameComponent ? (
        /* Active Game View */
        <div className="relative z-10 px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setActiveGame(null)}
              className="mb-4 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-bold transition-all"
            >
              ← Back to Games
            </button>
            <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 shadow-2xl">
              <ActiveGameComponent />
            </div>
          </div>
        </div>
      ) : (
        /* Games Grid */
        <div className="relative z-10 px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-white/80 text-xl mb-8">
              Pick a game and have fun! 🎉
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  className={`bg-gradient-to-br ${game.color} rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-300 text-white text-center group`}
                >
                  <div className="text-4xl md:text-5xl mb-2 group-hover:animate-bounce">
                    {game.name.split(" ")[0]}
                  </div>
                  <h3 className="font-bold text-lg md:text-xl mb-1">
                    {game.name.split(" ").slice(1).join(" ")}
                  </h3>
                  <p className="text-sm opacity-90">{game.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/60">Made with 💖 for Yusuf</p>
      </footer>
    </main>
  );
}
