"use client";

import { useEffect, useState } from "react";
import { getYusufDates, type YusufDates } from "./yusuf";

/**
 * Keeps Yusuf's age and birthday countdown correct in the browser.
 *
 * The site is a static export, so the HTML is frozen at build time. The first
 * render uses that build-time value (right for up to a year, and it means no
 * flash of an empty number), then this recalculates from the visitor's own
 * clock on mount and every hour after — so the site stays true even if nobody
 * touches the code for years.
 */
export function useYusuf(): YusufDates {
  const [dates, setDates] = useState<YusufDates>(() => getYusufDates());

  useEffect(() => {
    const update = () => setDates(getYusufDates());
    update();
    const timer = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return dates;
}

/** True once the component has hydrated — for effects that must not run on the server. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
