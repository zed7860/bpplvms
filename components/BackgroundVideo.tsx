"use client";

import { useEffect, useRef } from "react";

export default function BackgroundVideo() {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let active = true;

    async function requestWakeLock() {
      if (!active || document.visibilityState !== "visible" || !("wakeLock" in navigator)) return;
      try {
        wakeLock.current = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock requires browser support and may be denied by device policy.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") requestWakeLock();
    }

    requestWakeLock();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLock.current?.release().catch(() => undefined);
    };
  }, []);

  return <video className="background-video" autoPlay muted loop playsInline preload="auto" poster="/images/bangalore-skyline.jpg" aria-hidden="true"><source src="/images/Background.mp4" type="video/mp4" /></video>;
}
