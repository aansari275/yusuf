"use client";

import Link from "next/link";
import Confetti from "./components/home/Confetti";
import JokeBox from "./components/home/JokeBox";
import SillyMeter from "./components/home/SillyMeter";
import { useYusuf } from "./lib/useYusuf";
import { FACTS, LOVES } from "./lib/yusuf";

/* Decorative stickers scattered behind the hero. Positions are fixed rather
   than random so the static HTML and the browser always agree. */
const FLOATERS = [
  { emoji: "⭐", top: "12%", left: "6%", delay: "0s" },
  { emoji: "🚀", top: "22%", right: "8%", delay: "1.2s" },
  { emoji: "🦖", top: "62%", left: "9%", delay: "2.4s" },
  { emoji: "🎈", bottom: "16%", right: "7%", delay: "0.6s" },
  { emoji: "🌈", top: "44%", right: "4%", delay: "3s" },
  { emoji: "🍫", bottom: "28%", left: "16%", delay: "1.8s" },
];

const FACT_COLORS = ["bg-sky", "bg-berry", "bg-mint", "bg-tangerine"];
const LOVE_COLORS = [
  "bg-grape",
  "bg-mint",
  "bg-sky",
  "bg-tangerine",
  "bg-berry",
  "bg-sun",
];

export default function Home() {
  const { age, nextAge, nextAgeOrdinal, daysUntilBirthday, isBirthday, year } =
    useYusuf();

  return (
    <main className="relative overflow-hidden">
      {isBirthday && <Confetti />}

      {/* Soft colour wash behind everything */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="animate-drift absolute -left-24 top-10 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />
        <div className="animate-drift absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-berry/20 blur-3xl [animation-delay:3s]" />
        <div className="animate-drift absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sun/25 blur-3xl [animation-delay:6s]" />
      </div>

      {/* ---------- Nav ---------- */}
      <nav className="sticky top-0 z-30 border-b border-ink/5 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-extrabold sm:text-xl">
            Yusuf <span aria-hidden="true">🦖</span>
          </span>
          <div className="flex items-center gap-1 text-sm font-bold sm:gap-2 sm:text-base">
            <a className="rounded-full px-3 py-2 hover:bg-paper-deep" href="#about">
              About
            </a>
            <a className="rounded-full px-3 py-2 hover:bg-paper-deep" href="#fun">
              Fun
            </a>
            <Link
              className="toy-button bg-mint !px-4 !py-2 !text-sm sm:!px-5 sm:!text-base"
              href="/games"
            >
              Games 🎮
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------- Hero ---------- */}
      <section className="relative px-4 pb-10 pt-12 sm:pt-16">
        <div aria-hidden="true">
          {FLOATERS.map((floater, i) => (
            <span
              key={i}
              className="animate-bob pointer-events-none absolute hidden text-4xl opacity-80 lg:block"
              style={{
                top: floater.top,
                left: floater.left,
                right: floater.right,
                bottom: floater.bottom,
                animationDelay: floater.delay,
              }}
            >
              {floater.emoji}
            </span>
          ))}
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="animate-wave inline-block text-6xl sm:text-7xl" aria-hidden="true">
            👋
          </span>

          <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
            Hi, I&apos;m <span className="text-berry">Yusuf!</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-balance text-xl text-ink-soft sm:text-2xl">
            I&apos;m the silliest kid in Noida, I love dinosaurs and fast cars, and I
            could eat white chocolate all day. 🍫
          </p>

          {/* Age medallion — always current, never hardcoded */}
          <div className="mt-10 flex flex-col items-center">
            <div className="sticker relative flex h-48 w-48 flex-col items-center justify-center rounded-full sm:h-64 sm:w-64">
              <span
                className="absolute inset-2 rounded-full border-4 border-dashed border-sun/70"
                aria-hidden="true"
              />
              <span className="text-8xl font-black leading-none text-berry sm:text-9xl">
                {age}
              </span>
              <span className="mt-1 text-lg font-extrabold text-ink-soft sm:text-xl">
                years old
              </span>
            </div>

            <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-base font-extrabold shadow-[0_4px_0_var(--shadow-warm)] sm:text-lg">
              <span className="text-2xl" aria-hidden="true">
                🎂
              </span>
              {isBirthday ? (
                <>It&apos;s my birthday today! I&apos;m {age}!</>
              ) : (
                <>
                  {daysUntilBirthday} {daysUntilBirthday === 1 ? "sleep" : "sleeps"}{" "}
                  until I turn {nextAge}!
                </>
              )}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/games" className="toy-button bg-berry text-xl">
              🎮 Play my games
            </Link>
            <a href="#about" className="toy-button bg-sky">
              🌟 About me
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Facts ---------- */}
      <section id="about" className="scroll-mt-20 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-black sm:text-5xl">
            All about me <span aria-hidden="true">🎯</span>
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {FACTS.map((fact, i) => (
              <div key={fact.label} className="sticker-button p-6 text-center">
                <span
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${FACT_COLORS[i % FACT_COLORS.length]}`}
                  aria-hidden="true"
                >
                  {fact.emoji}
                </span>
                <p className="mt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
                  {fact.label}
                </p>
                <p className="mt-1 text-xl font-black leading-tight">{fact.value}</p>
              </div>
            ))}
          </div>

          {/* Bhadohi to Noida */}
          <div className="sticker mt-6 overflow-hidden p-8 sm:p-12">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <span className="text-6xl sm:text-7xl" aria-hidden="true">
                🏠
              </span>
              <div>
                <h3 className="text-2xl font-black sm:text-3xl">
                  From <span className="text-tangerine">Bhadohi</span> to{" "}
                  <span className="text-sky">Noida</span>
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                  My family is from <strong className="text-ink">Bhadohi</strong>, the
                  town famous for beautiful carpets. Now I live in{" "}
                  <strong className="text-ink">Noida</strong> and I go to{" "}
                  <strong className="text-ink">Shiv Nadar School</strong>, where I learn
                  cool stuff and have loads of friends.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Things I love ---------- */}
      <section id="fun" className="scroll-mt-20 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-4xl font-black sm:text-5xl">
            Things I love <span aria-hidden="true">💛</span>
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {LOVES.map((love, i) => (
              <div
                key={love.title}
                className={`sticker-button p-6 text-white ${LOVE_COLORS[i % LOVE_COLORS.length]}`}
              >
                <span className="text-5xl" aria-hidden="true">
                  {love.emoji}
                </span>
                <h3 className="mt-3 text-2xl font-black">{love.title}</h3>
                <p className="mt-1 text-lg font-semibold opacity-90">{love.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Play with me ---------- */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-4xl font-black sm:text-5xl">
            Play with me <span aria-hidden="true">🎲</span>
          </h2>
          <p className="mt-3 text-center text-lg text-ink-soft">
            Two things to press. Go on, press them.
          </p>

          <div className="mt-10 space-y-6">
            <SillyMeter />
            <JokeBox />
          </div>
        </div>
      </section>

      {/* ---------- Arcade ---------- */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="sticker relative overflow-hidden bg-ink p-10 text-center text-white sm:p-14">
            <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
              <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-grape blur-3xl" />
              <div className="absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-sky blur-3xl" />
            </div>

            <div className="relative">
              <span className="animate-bob inline-block text-6xl sm:text-7xl" aria-hidden="true">
                🕹️
              </span>
              <h2 className="mt-4 text-4xl font-black sm:text-5xl">Yusuf&apos;s Arcade</h2>
              <p className="mx-auto mt-3 max-w-md text-lg text-white/80">
                21 games I picked myself — racing, dinosaurs, ninjas and loads more.
                Free to play, right here.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 text-3xl" aria-hidden="true">
                {["🏎️", "🚀", "🐦", "🥊", "🦖", "🎈", "🍬", "🧠", "🐍", "🧱"].map(
                  (emoji, i) => (
                    <span
                      key={i}
                      className="animate-bob inline-block"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    >
                      {emoji}
                    </span>
                  ),
                )}
              </div>

              <Link href="/games" className="toy-button mt-8 bg-sun text-xl !text-ink">
                Play now! 🎮
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Birthday countdown ---------- */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="sticker bg-paper-deep p-10 text-center sm:p-12">
            <span className="animate-wiggle inline-block text-6xl" aria-hidden="true">
              🎂
            </span>
            {isBirthday ? (
              <>
                <h2 className="mt-4 text-4xl font-black sm:text-5xl">
                  It&apos;s my birthday!
                </h2>
                <p className="mt-3 text-xl font-bold text-ink-soft">
                  I&apos;m {age} today. Thank you for visiting! 🎉
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-4xl font-black sm:text-5xl">
                  My birthday is 1st June
                </h2>
                <p className="mt-4 text-2xl font-extrabold">
                  <span className="block text-6xl text-berry sm:text-7xl">
                    {daysUntilBirthday}
                  </span>
                  {daysUntilBirthday === 1 ? "sleep" : "sleeps"} until my{" "}
                  {nextAgeOrdinal} birthday!
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="px-4 pb-14 pt-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="flex justify-center gap-3 text-3xl" aria-hidden="true">
            {["🌟", "🚀", "🦖", "🎈", "🍫", "🎉"].map((emoji, i) => (
              <span
                key={i}
                className="animate-bob inline-block"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {emoji}
              </span>
            ))}
          </div>

          <p className="mt-6 text-lg font-bold">
            Made with <span className="text-berry">💖</span> for Yusuf Ansari
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            © {year} mdyusuf.com — the silliest website on the internet 🤪
          </p>
        </div>
      </footer>
    </main>
  );
}
