// Everything about Yusuf that changes with the calendar lives here, so the site
// never has a hardcoded age in it again.

/** Yusuf was born on 1 June 2020. */
export const BIRTH_YEAR = 2020;
export const BIRTH_MONTH = 6; // June (1-indexed, the way humans write it)
export const BIRTH_DAY = 1;

export type YusufDates = {
  /** How old Yusuf is right now, in whole years. */
  age: number;
  /** The age he is turning on his next birthday. */
  nextAge: number;
  /** Whole days until the next 1st of June (0 when today IS his birthday). */
  daysUntilBirthday: number;
  /** True on 1 June. */
  isBirthday: boolean;
  /** e.g. "6th" — for "my 6th birthday". */
  nextAgeOrdinal: string;
  /** Current calendar year, for the footer. */
  year: number;
};

/** "1st", "2nd", "3rd", "4th"… */
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Works out Yusuf's age and birthday countdown from a given moment.
 *
 * Called once at build time to fill in the static HTML, then again in the
 * browser on every visit — so the number is right even if the site has not been
 * rebuilt since his last birthday.
 */
export function getYusufDates(now: Date = new Date()): YusufDates {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const hasHadBirthdayThisYear =
    month > BIRTH_MONTH || (month === BIRTH_MONTH && day >= BIRTH_DAY);

  const age = year - BIRTH_YEAR - (hasHadBirthdayThisYear ? 0 : 1);
  const isBirthday = month === BIRTH_MONTH && day === BIRTH_DAY;

  // Compare date-only values so a visit at 11pm doesn't round the countdown off
  // by a day.
  const today = new Date(year, month - 1, day);
  const birthdayThisYear = new Date(year, BIRTH_MONTH - 1, BIRTH_DAY);
  const nextBirthday =
    birthdayThisYear >= today
      ? birthdayThisYear
      : new Date(year + 1, BIRTH_MONTH - 1, BIRTH_DAY);

  const daysUntilBirthday = Math.round(
    (nextBirthday.getTime() - today.getTime()) / MS_PER_DAY,
  );

  const nextAge = isBirthday ? age : age + 1;

  return {
    age,
    nextAge,
    daysUntilBirthday,
    isBirthday,
    nextAgeOrdinal: ordinal(nextAge),
    year,
  };
}

export const FACTS = [
  { emoji: "🏫", label: "My school", value: "Shiv Nadar" },
  { emoji: "🏠", label: "I live in", value: "Noida" },
  { emoji: "🌍", label: "I'm from", value: "Bhadohi" },
  { emoji: "🍫", label: "Best snack", value: "White chocolate" },
] as const;

export const LOVES = [
  { emoji: "🎮", title: "Playing games", note: "All day, every day!" },
  { emoji: "🦖", title: "Dinosaurs", note: "ROAAAAR!" },
  { emoji: "🏎️", title: "Fast cars", note: "Vroom vroom!" },
  { emoji: "🍫", title: "White chocolate", note: "The best one." },
  { emoji: "😂", title: "Silly jokes", note: "I know loads." },
  { emoji: "🚀", title: "Space rockets", note: "3… 2… 1… blast off!" },
] as const;

export const JOKES = [
  { q: "Why did the dinosaur cross the road?", a: "Because chickens weren't invented yet! 🦖" },
  { q: "What do you call a sleeping T-Rex?", a: "A dino-snore! 😴" },
  { q: "Why did the cookie go to the doctor?", a: "It was feeling crumby! 🍪" },
  { q: "What's brown and sticky?", a: "A stick! 🪵" },
  { q: "Why can't your nose be 12 inches long?", a: "Because then it would be a foot! 👃" },
  { q: "What do you call cheese that isn't yours?", a: "Nacho cheese! 🧀" },
  { q: "Why was the maths book sad?", a: "It had too many problems! 📕" },
  { q: "What goes up but never comes down?", a: "Your age! 🎂" },
] as const;
