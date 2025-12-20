"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const funFacts = [
    { emoji: "🎂", label: "Age", value: "5" },
    { emoji: "🏫", label: "School", value: "Shiv Nadar" },
    { emoji: "🏠", label: "Lives In", value: "Noida" },
    { emoji: "🍫", label: "Fav Food", value: "White Chocolate" },
  ];

  const sillyThings = [
    "Making funny faces 🤪",
    "Running around super fast 🏃‍♂️",
    "Telling silly jokes 😂",
    "Playing all day long 🎮",
    "Being the funniest kid ever! 🌟",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-40 right-1/4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Floating Emojis */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <span className="absolute text-4xl animate-float" style={{ top: "10%", left: "5%" }}>⭐</span>
          <span className="absolute text-4xl animate-float animation-delay-1000" style={{ top: "20%", right: "10%" }}>🚀</span>
          <span className="absolute text-4xl animate-float animation-delay-2000" style={{ top: "60%", left: "8%" }}>🦖</span>
          <span className="absolute text-4xl animate-float animation-delay-3000" style={{ bottom: "20%", right: "5%" }}>🎈</span>
          <span className="absolute text-4xl animate-float animation-delay-4000" style={{ top: "40%", right: "3%" }}>🌈</span>
          <span className="absolute text-4xl animate-float animation-delay-5000" style={{ bottom: "30%", left: "15%" }}>🎉</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="relative z-10">
          {/* Animated Wave Emoji */}
          <div className="text-6xl md:text-8xl mb-4 animate-wave inline-block">👋</div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
              Hi, I&apos;m Yusuf!
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-6 font-medium">
            I&apos;m <span className="text-blue-500 font-bold">5 years old</span> and I&apos;m{" "}
            <span className="text-pink-500 font-bold">super silly!</span> 🤪
          </p>

          {/* Fun Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg mb-8 animate-bounce-slow">
            <span className="text-2xl">🍫</span>
            <span className="text-lg font-semibold text-gray-700">White Chocolate Lover!</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#about"
              className="group bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="mr-2">🌟</span>
              About Me
              <span className="ml-2 group-hover:animate-spin inline-block">✨</span>
            </a>
            <a
              href="/games"
              className="group bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse"
            >
              <span className="mr-2">🎮</span>
              Play Games!
              <span className="ml-2 group-hover:animate-bounce inline-block">🕹️</span>
            </a>
            <a
              href="#fun"
              className="group bg-gradient-to-r from-pink-500 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="mr-2">🤪</span>
              Fun Stuff
              <span className="ml-2 group-hover:animate-bounce inline-block">🎈</span>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce">
          <span className="text-4xl">👇</span>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12">
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Fun Facts About Me! 🎯
            </span>
          </h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {funFacts.map((fact, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="text-5xl mb-3 block">{fact.emoji}</span>
                <p className="text-gray-500 text-sm font-medium mb-1">{fact.label}</p>
                <p className="text-2xl font-black text-gray-800">{fact.value}</p>
              </div>
            ))}
          </div>

          {/* About Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl max-w-4xl mx-auto">
            <div className="text-center">
              <span className="text-6xl mb-6 block">🏠</span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                From <span className="text-orange-500">Bhadohi</span> to{" "}
                <span className="text-blue-500">Noida</span>!
              </h3>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                I live in <strong className="text-blue-600">Noida</strong> with my family,
                but I&apos;m originally from <strong className="text-orange-600">Bhadohi</strong>!
                I go to <strong className="text-purple-600">Shiv Nadar School</strong> where
                I learn lots of cool things and make tons of friends! 🏫✨
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fun Stuff Section */}
      <section id="fun" className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12">
            <span className="bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">
              Why I&apos;m Super Silly! 🤪
            </span>
          </h2>

          {/* Silly Things List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {sillyThings.map((thing, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:rotate-1 transition-all duration-300"
              >
                <p className="text-xl font-bold text-center">{thing}</p>
              </div>
            ))}
          </div>

          {/* Big Fun Statement */}
          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-10 py-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
              <p className="text-2xl md:text-3xl font-black">
                🎮 I LOVE PLAYING! 🎮
              </p>
              <p className="text-lg mt-2 opacity-90">
                Playing is my favorite thing in the whole world!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Games Arcade Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl text-center text-white overflow-hidden relative">
            {/* Animated stars */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
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

            <div className="relative z-10">
              <div className="text-6xl md:text-7xl mb-4 animate-bounce">🕹️</div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Yusuf&apos;s Game Arcade!
              </h2>
              <p className="text-xl mb-6 opacity-90">
                10 super fun games to play!
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {["🏎️", "🚀", "🐦", "🥊", "🦖", "🎈", "🍬", "🧠", "🐍", "🧱"].map((emoji, i) => (
                  <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                    {emoji}
                  </span>
                ))}
              </div>
              <a
                href="/games"
                className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-10 py-4 rounded-full font-black text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🎮 PLAY NOW! 🎮
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Favorite Food Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-12 shadow-2xl">
            <span className="text-8xl mb-6 block animate-wiggle">🍫</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">
              My Favorite Food
            </h2>
            <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">
              White Chocolate!
            </p>
            <p className="text-xl text-gray-600 mt-4">
              It&apos;s so yummy and sweet! 😋
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Emojis */}
          <div className="flex justify-center gap-4 mb-6">
            {["🌟", "🚀", "🦖", "🎈", "🍫", "🎉"].map((emoji, index) => (
              <span
                key={index}
                className="text-3xl animate-bounce"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>

          <p className="text-gray-600 text-lg">
            Made with <span className="text-red-500">💖</span> for{" "}
            <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Yusuf Ansari
            </span>
          </p>

          <div className="mt-4 h-1 w-40 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>

          <p className="text-gray-400 text-sm mt-4">
            © 2025 Yusuf Ansari • The Silliest Kid Ever! 🤪
          </p>
        </div>
      </footer>
    </main>
  );
}
