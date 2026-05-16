"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "canu_color_swatches";
const MAX_SWATCHES = 20;
const DEFAULT_SWATCHES = [
  "#ffffff",
  "#000000",
  "#ff6b6b",
  "#ffa94d",
  "#ffd43b",
  "#69db7c",
  "#4dabf7",
  "#748ffc",
  "#da77f2",
  "#f783ac",
  "#adb5bd",
  "#495057",
  "#c92a2a",
  "#a61e4d",
  "#862e9c",
  "#364fc7",
  "#0b7285",
  "#2b8a3e",
  "#e67700",
  "#5c4033",
];

export function useColorSwatches() {
  const [swatches, setSwatches] = useState(DEFAULT_SWATCHES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSwatches(JSON.parse(saved));
    } catch {}
  }, []);

  const persist = useCallback((arr) => {
    setSwatches(arr);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {}
  }, []);

  const addSwatch = useCallback((color) => {
    setSwatches((prev) => {
      if (prev.includes(color)) return prev;
      const next = [color, ...prev].slice(0, MAX_SWATCHES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setSwatch = useCallback((index, color) => {
    setSwatches((prev) => {
      const next = [...prev];
      next[index] = color;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeSwatch = useCallback((index) => {
    setSwatches((prev) => {
      const next = prev.filter((_, i) => i !== index);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetSwatches = useCallback(() => persist(DEFAULT_SWATCHES), [persist]);

  return { swatches, addSwatch, setSwatch, removeSwatch, resetSwatches };
}
