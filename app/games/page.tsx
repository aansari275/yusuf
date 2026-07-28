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

/*
 * A fixed pseudo-random starfield. Seeded (with Yusuf's birthday) so the
 * pre-rendered HTML and the browser produce identical markup — plain
 * Math.random() here caused a hydration mismatch in the static export.
 */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const STARS = (() => {
  const rand = seededRandom(20200601);
  return Array.from({ length: 70 }, () => ({
    top: rand() * 100,
    left: rand() * 100,
    size: rand() > 0.7 ? 3 : 2,
    gold: rand() > 0.5,
    delay: rand() * 3,
    duration: 1 + rand() * 2,
  }));
})();

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const ActiveGameComponent = games.find(g => g.id === activeGame)?.component;
  const activeGameData = games.find(g => g.id === activeGame);

  const newGames = games.filter(g => g.isNew && !g.featured);
  const originalGames = games.filter(g => !g.isNew);
  const featuredGame = games.find(g => g.featured);

  return (
    <main className="min-h-screen overflow-hidden bg-ink">
      {/* Night-sky starfield */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full"
            style={{
              width: star.size,
              height: star.size,
              backgroundColor: star.gold ? "#ffc53d" : "#ffffff",
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-grape/30 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-full px-3 py-2 font-bold text-white transition-colors hover:bg-white/10"
          >
            <span className="text-xl transition-transform group-hover:-translate-x-1" aria-hidden="true">
              👈
            </span>
            <span className="hidden sm:inline">Back home</span>
          </Link>
          <h1 className="text-xl font-black text-white sm:text-3xl">
            <span aria-hidden="true">🎮</span> Yusuf&apos;s Arcade
          </h1>
          <div className="w-10 sm:w-28" />
        </div>
      </header>

      {activeGame && ActiveGameComponent ? (
        /* Active Game View */
        <div className="relative z-10 px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setActiveGame(null)}
              className="toy-button mb-4 bg-white/15 !px-5 !py-2 !text-base"
            >
              <span className="text-lg" aria-hidden="true">
                ←
              </span>{" "}
              Back to games
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
            <div className="mb-8 pt-8 text-center">
              <p className="text-2xl font-extrabold text-white sm:text-3xl">
                Pick a game and have fun! 🎉
              </p>
              <p className="mt-2 font-semibold text-white/60">
                {games.length} awesome games to play
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
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-white">
                <span className="rounded-full bg-mint px-2 py-1 text-xs font-black text-ink">
                  NEW
                </span>
                Fresh Games 🎮
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {newGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className={`bg-gradient-to-br ${game.color} group relative overflow-hidden rounded-[28px] p-4 text-center text-white shadow-[0_6px_0_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.35)] md:p-6`}
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
              <h2 className="mb-4 text-2xl font-black text-white">Classic Games 🕹️</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                {originalGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id)}
                    className={`bg-gradient-to-br ${game.color} group relative overflow-hidden rounded-[28px] p-4 text-center text-white shadow-[0_6px_0_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.35)] md:p-6`}
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
              {[
                { emoji: "🎮", value: String(games.length), label: "Games" },
                { emoji: "⭐", value: "∞", label: "Fun" },
                { emoji: "🏆", value: "You!", label: "Champion" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[28px] bg-white/10 p-4 backdrop-blur-sm"
                >
                  <div className="text-3xl md:text-4xl" aria-hidden="true">
                    {stat.emoji}
                  </div>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-sm font-semibold text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <p className="font-bold text-white/70">Made with 💖 for Yusuf</p>
        <p className="mt-1 text-sm text-white/40">Have fun playing! 🎉</p>
      </footer>
    </main>
  );
}
