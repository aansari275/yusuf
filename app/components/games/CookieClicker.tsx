"use client";

import { useState, useEffect, useCallback } from "react";

interface Upgrade {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  cps: number; // cookies per second
  owned: number;
}

interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function CookieClicker() {
  const [cookies, setCookies] = useState(0);
  const [totalCookies, setTotalCookies] = useState(0);
  const [cookiesPerClick, setCookiesPerClick] = useState(1);
  const [cookiesPerSecond, setCookiesPerSecond] = useState(0);
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([]);
  const [cookieScale, setCookieScale] = useState(1);
  const [goldenCookie, setGoldenCookie] = useState<{ x: number; y: number } | null>(null);
  const [frenzy, setFrenzy] = useState(false);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { id: "cursor", name: "Auto Clicker", emoji: "👆", baseCost: 15, cps: 0.1, owned: 0 },
    { id: "grandma", name: "Grandma", emoji: "👵", baseCost: 100, cps: 1, owned: 0 },
    { id: "farm", name: "Cookie Farm", emoji: "🌾", baseCost: 500, cps: 5, owned: 0 },
    { id: "factory", name: "Factory", emoji: "🏭", baseCost: 2000, cps: 20, owned: 0 },
    { id: "mine", name: "Cookie Mine", emoji: "⛏️", baseCost: 10000, cps: 100, owned: 0 },
    { id: "wizard", name: "Wizard Tower", emoji: "🧙", baseCost: 50000, cps: 500, owned: 0 },
    { id: "portal", name: "Portal", emoji: "🌀", baseCost: 250000, cps: 2500, owned: 0 },
    { id: "time", name: "Time Machine", emoji: "⏰", baseCost: 1000000, cps: 10000, owned: 0 },
  ]);

  const effectIdRef = { current: 0 };

  const getUpgradeCost = (upgrade: Upgrade) => {
    return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.owned));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return Math.floor(num).toString();
  };

  const clickCookie = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const amount = frenzy ? cookiesPerClick * 7 : cookiesPerClick;
    setCookies(c => c + amount);
    setTotalCookies(t => t + amount);

    setClickEffects(prev => [...prev.slice(-10), {
      id: effectIdRef.current++,
      x,
      y,
      value: amount,
    }]);

    setCookieScale(0.9);
    setTimeout(() => setCookieScale(1), 50);
  }, [cookiesPerClick, frenzy]);

  const buyUpgrade = (upgradeId: string) => {
    setUpgrades(prev => prev.map(upgrade => {
      if (upgrade.id !== upgradeId) return upgrade;
      const cost = getUpgradeCost(upgrade);
      if (cookies >= cost) {
        setCookies(c => c - cost);
        const newOwned = upgrade.owned + 1;
        // Update cookies per second
        setCookiesPerSecond(cps => cps + upgrade.cps);
        // Cursor also increases click power
        if (upgrade.id === "cursor") {
          setCookiesPerClick(cpc => cpc + 0.1);
        }
        return { ...upgrade, owned: newOwned };
      }
      return upgrade;
    }));
  };

  const clickGoldenCookie = () => {
    if (!goldenCookie) return;
    setGoldenCookie(null);
    setFrenzy(true);
    setTimeout(() => setFrenzy(false), 10000);
  };

  // Passive income
  useEffect(() => {
    const interval = setInterval(() => {
      if (cookiesPerSecond > 0) {
        setCookies(c => c + cookiesPerSecond / 10);
        setTotalCookies(t => t + cookiesPerSecond / 10);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [cookiesPerSecond]);

  // Golden cookie spawner
  useEffect(() => {
    const interval = setInterval(() => {
      if (!goldenCookie && Math.random() < 0.1) {
        setGoldenCookie({
          x: Math.random() * 60 + 20,
          y: Math.random() * 60 + 20,
        });
        // Auto-hide after 10 seconds
        setTimeout(() => setGoldenCookie(null), 10000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [goldenCookie]);

  // Clean old effects
  useEffect(() => {
    const cleanup = setInterval(() => {
      setClickEffects(prev => prev.slice(-5));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start justify-center">
      {/* Main cookie area */}
      <div className="flex flex-col items-center">
        {/* Stats */}
        <div className="text-center mb-4">
          <div className="text-3xl font-black text-amber-400">
            🍪 {formatNumber(cookies)}
          </div>
          <div className="text-lg text-gray-400">
            per second: <span className="text-green-400">{formatNumber(cookiesPerSecond)}</span>
          </div>
          {frenzy && (
            <div className="text-yellow-400 font-bold animate-pulse">
              ⭐ FRENZY x7! ⭐
            </div>
          )}
        </div>

        {/* Cookie */}
        <div
          className={`relative w-64 h-64 rounded-full cursor-pointer select-none ${frenzy ? "animate-pulse" : ""}`}
          onClick={clickCookie}
        >
          {/* Background glow */}
          <div className={`absolute inset-0 rounded-full ${frenzy ? "bg-yellow-500/30 animate-ping" : "bg-amber-500/20"}`} />

          {/* Cookie */}
          <div
            className="text-[180px] flex items-center justify-center h-full transition-transform"
            style={{ transform: `scale(${cookieScale})` }}
          >
            🍪
          </div>

          {/* Click effects */}
          {clickEffects.map(effect => (
            <div
              key={effect.id}
              className="absolute pointer-events-none text-xl font-bold text-yellow-300 animate-bounce"
              style={{
                left: effect.x,
                top: effect.y,
                animation: "floatUp 0.8s ease-out forwards",
              }}
            >
              +{formatNumber(effect.value)}
            </div>
          ))}

          {/* Golden cookie */}
          {goldenCookie && (
            <div
              className="absolute text-5xl animate-bounce cursor-pointer z-10"
              style={{
                left: `${goldenCookie.x}%`,
                top: `${goldenCookie.y}%`,
                filter: "drop-shadow(0 0 10px gold)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                clickGoldenCookie();
              }}
            >
              ✨🍪
            </div>
          )}
        </div>

        {/* Click power */}
        <div className="mt-4 text-gray-400 text-sm">
          Click power: <span className="text-amber-400">{formatNumber(cookiesPerClick)}</span>
        </div>
        <div className="text-gray-500 text-xs">
          Total baked: {formatNumber(totalCookies)}
        </div>
      </div>

      {/* Upgrades shop */}
      <div className="bg-gray-800/50 rounded-xl p-4 w-72 max-h-[400px] overflow-y-auto">
        <h3 className="text-lg font-bold text-amber-400 mb-3 text-center">🏪 Cookie Shop</h3>
        <div className="space-y-2">
          {upgrades.map(upgrade => {
            const cost = getUpgradeCost(upgrade);
            const canAfford = cookies >= cost;
            return (
              <button
                key={upgrade.id}
                onClick={() => buyUpgrade(upgrade.id)}
                disabled={!canAfford}
                className={`w-full p-3 rounded-lg transition-all flex items-center gap-3 ${
                  canAfford
                    ? "bg-amber-600/50 hover:bg-amber-600/70 cursor-pointer"
                    : "bg-gray-700/30 opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="text-3xl">{upgrade.emoji}</span>
                <div className="text-left flex-1">
                  <div className="font-bold text-white text-sm">{upgrade.name}</div>
                  <div className="text-xs text-gray-400">
                    🍪 {formatNumber(cost)} • +{formatNumber(upgrade.cps)}/s
                  </div>
                </div>
                <div className="bg-gray-900 px-2 py-1 rounded text-sm font-bold text-amber-400">
                  {upgrade.owned}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
