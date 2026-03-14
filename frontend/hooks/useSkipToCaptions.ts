"use client";

import { useEffect } from "react";

const CAPTIONS_SECTION_ID = "captions-section";

export function useSkipToCaptions() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        document.getElementById(CAPTIONS_SECTION_ID)?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export function scrollToCaptions() {
  document.getElementById(CAPTIONS_SECTION_ID)?.scrollIntoView({ behavior: "smooth" });
}

export { CAPTIONS_SECTION_ID };
