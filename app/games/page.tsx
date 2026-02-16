"use client";

import { useState } from "react";
import Link from "next/link";

// Original games
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

// New amazing games
import DinoHunterThar from "../components/games/DinoHunterThar";
import FruitNinja from "../components/games/FruitNinja";
import Game2048 from "../components/games/Game2048";
import WhackAMole from "../components/games/WhackAMole";
import CookieClicker from "../components/games/CookieClicker";
import ColorSwitch from "../components/games/ColorSwitch";
import GeometryJump from "../components/games/GeometryJump";
import StackTower from "../components/games/StackTower";
import BubbleShooter from "../components/games/BubbleShooter";
import NinjaRunner from "../components/games/NinjaRunner";
import SteeringRacer from "../components/games/SteeringRacer";

const games = [
  // Featured new game - Steering Wheel Racing!
  {
    id: "steeringracer",
    name: "🏎️ Turbo Racer",
    description: "Turn the steering wheel with your fingers to race!",
    color: "from-blue-600 to-cyan-500",
    component: SteeringRacer,
    featured: true,
    isNew: true
  },
  {
    id: "dinohunter",
    name: "🦖 Dino Hunter Thar",
    description: "Drive your Thar, shoot dinosaurs, avoid volcanoes!",
    color: "from-red-600 to-orange-600",
    component: DinoHunterThar,
    isNew: true
  },
  // New games
  {
    id: "fruitninja",
    name: "🍉 Fruit Ninja",
    description: "Slice fruits, avoid bombs!",
    color: "from-green-500 to-lime-500",
    component: FruitNinja,
    isNew: true
  },
  {
    id: "2048",
    name: "🔢 2048",
    description: "Merge tiles to reach 2048!",
    color: "from-amber-500 to-yellow-500",
    component: Game2048,
    isNew: true
  },
  {
    id: "whackamole",
    name: "🐹 Whack-a-Mole",
    description: "Bonk the moles before they hide!",
    color: "from-amber-600 to-orange-500",
    component: WhackAMole,
    isNew: true
  },
  {
    id: "cookieclicker",
    name: "🍪 Cookie Clicker",
    description: "Bake cookies, buy upgrades, get rich!",
    color: "from-amber-700 to-yellow-600",
    component: CookieClicker,
    isNew: true
  },
  {
    id: "colorswitch",
    name: "🌈 Color Switch",
    description: "Jump through matching colors!",
    color: "from-cyan-500 to-purple-500",
    component: ColorSwitch,
    isNew: true
  },
  {
    id: "geometryjump",
    name: "🟨 Geometry Jump",
    description: "Jump and dash through obstacles!",
    color: "from-yellow-500 to-orange-500",
    component: GeometryJump,
    isNew: true
  },
  {
    id: "stacktower",
    name: "🏗️ Stack Tower",
    description: "Build the tallest tower!",
    color: "from-blue-500 to-cyan-500",
    component: StackTower,
    isNew: true
  },
  {
    id: "bubbleshooter",
    name: "🔵 Bubble Shooter",
    description: "Match 3+ bubbles to pop them!",
    color: "from-blue-600 to-indigo-500",
    component: BubbleShooter,
    isNew: true
  },
  {
    id: "ninjarunner",
    name: "🥷 Ninja Runner",
    description: "Run, slide and collect coins!",
    color: "from-purple-600 to-pink-500",
    component: NinjaRunner,
    isNew: true
  },
  // Original games
  {
    id: "racing",
    name: "🏎️ Speed Racer",
    description: "Dodge cars and go fast!",
    color: "from-red-500 to-orange-500",
    component: RacingGame
  },
  {
    id: "shooter",
    name: "🚀 Space Blaster",
    description: "Shoot the aliens!",
    color: "from-purple-500 to-blue-500",
    component: SpaceShooter
  },
  {
    id: "flappy",
    name: "🐦 Flappy Yusuf",
    description: "Fly through the pipes!",
    color: "from-green-500 to-teal-500",
    component: FlappyBird
  },
  {
    id: "boxing",
    name: "🥊 Punch Master",
    description: "Knock them out!",
    color: "from-red-600 to-pink-500",
    component: BoxingGame
  },
  {
    id: "dino",
    name: "🦕 Dino Jump",
    description: "Jump over cacti!",
    color: "from-gray-600 to-gray-500",
    component: DinoRunner
  },
  {
    id: "balloon",
    name: "🎈 Balloon Pop",
    description: "Pop all the balloons!",
    color: "from-pink-500 to-purple-500",
    component: BalloonPop
  },
  {
    id: "candy",
    name: "🍬 Candy Catch",
    description: "Catch the yummy candy!",
    color: "from-yellow-400 to-orange-500",
    component: CandyCatch
  },
  {
    id: "memory",
    name: "🧠 Memory Match",
    description: "Match the pairs!",
    color: "from-indigo-500 to-purple-500",
    component: MemoryMatch
  },
  {
    id: "snake",
    name: "🐍 Snake Feast",
    description: "Eat and grow longer!",
    color: "from-green-600 to-lime-500",
    component: SnakeGame
  },
  {
    id: "brick",
    name: "🧱 Brick Breaker",
    description: "Break all the bricks!",
    color: "from-blue-500 to-cyan-500",
    component: BrickBreaker
  },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const ActiveGameComponent = games.find(g => g.id === activeGame)?.component;
  const activeGameData = games.find(g => g.id === activeGame);

  const newGames = games.filter(g => g.isNew && !g.featured);
  const originalGames = games.filter(g => !g.isNew);
  const featuredGame = games.find(g => g.featured);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated Stars Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: Math.random() > 0.7 ? "3px" : "2px",
              height: Math.random() > 0.7 ? "3px" : "2px",
              backgroundColor: Math.random() > 0.5 ? "#fff" : "#ffd700",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-bounce"
            style={{
              top: `${20 + Math.random() * 60}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white hover:text-yellow-300 transition-colors flex items-center gap-2 group">
            <span className="text-2xl group-hover:-translate-x-1 transition-transform">👈</span>
            <span className="font-bold">Back Home</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
            <span className="text-yellow-400 animate-pulse">🎮</span> Yusuf&apos;s Arcade <span className="text-yellow-400 animate-pulse">🎮</span>
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
              className="mb-4 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2"
            >
              <span className="text-lg">←</span> Back to Games
            </button>
            <div className={`bg-gradient-to-br ${activeGameData?.color || "from-gray-800 to-gray-900"} rounded-3xl p-1`}>
              <div className="bg-black/70 backdrop-blur-sm rounded-[22px] p-4 md:p-6 shadow-2xl">
                <ActiveGameComponent />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Games Grid */
        <div className="relative z-10 px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-white/90 text-xl md:text-2xl font-medium">
                Pick a game and have fun! 🎉
              </p>
              <p className="text-white/60 text-sm mt-2">
                21 awesome games to play!
              </p>
            </div>

            {/* Featured Game */}
            {featuredGame && (
              <div className="mb-8">
                <button
                  onClick={() => setActiveGame(featuredGame.id)}
                  className="w-full bg-gradient-to-br from-blue-600 via-cyan-500 to-green-500 rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-blue-500/30 transform hover:scale-[1.02] transition-all duration-300 text-white text-center group relative overflow-hidden"
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <div className="relative z-10">
                    <div className="text-5xl md:text-7xl mb-3 group-hover:animate-bounce flex justify-center gap-2">
                      <span>🏎️</span>
                      <span>💨</span>
                      <span>🛞</span>
                      <span>🏁</span>
                    </div>
                    <div className="inline-block bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full mb-2">
                      ⭐ FEATURED GAME
                    </div>
                    <h3 className="font-black text-2xl md:text-3xl mb-2">
                      Turbo Racer
                    </h3>
                    <p className="text-lg opacity-90">
                      Grab the steering wheel and turn it with your fingers to race through traffic! 🏁
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* New Games Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
                Fresh Games 🎮
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {newGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className={`bg-gradient-to-br ${game.color} rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-300 text-white text-center group relative overflow-hidden`}
                  >
                    {/* NEW badge */}
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      NEW
                    </div>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                    <div className="relative z-10">
                      <div className="text-4xl md:text-5xl mb-2 group-hover:animate-bounce">
                        {game.name.split(" ")[0]}
                      </div>
                      <h3 className="font-bold text-lg md:text-xl mb-1">
                        {game.name.split(" ").slice(1).join(" ")}
                      </h3>
                      <p className="text-sm opacity-90">{game.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Classic Games Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                Classic Games 🕹️
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                {originalGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className={`bg-gradient-to-br ${game.color} rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-300 text-white text-center group relative overflow-hidden`}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                    <div className="relative z-10">
                      <div className="text-4xl md:text-5xl mb-2 group-hover:animate-bounce">
                        {game.name.split(" ")[0]}
                      </div>
                      <h3 className="font-bold text-lg md:text-xl mb-1">
                        {game.name.split(" ").slice(1).join(" ")}
                      </h3>
                      <p className="text-sm opacity-90">{game.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fun Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl md:text-4xl">🎮</div>
                <div className="text-2xl font-bold text-white">21</div>
                <div className="text-white/60 text-sm">Games</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl md:text-4xl">⭐</div>
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-white/60 text-sm">Fun</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-3xl md:text-4xl">🏆</div>
                <div className="text-2xl font-bold text-white">You!</div>
                <div className="text-white/60 text-sm">Champion</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-white/60">Made with 💖 for Yusuf</p>
        <p className="text-white/40 text-sm mt-1">Have fun playing! 🎉</p>
      </footer>
    </main>
  );
}
