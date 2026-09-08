"use client";

import { useEffect, useState } from "react";
import { formatISTDate, formatISTTime12, formatISTTime24 } from "@/lib/datetime";

const ACCENTS = [
  { id: "rose", color: "#e77c5b" },
  { id: "blue", color: "#3b82f6" },
  { id: "purple", color: "#8b5cf6" },
  { id: "emerald", color: "#10b981" },
  { id: "amber", color: "#f5a623" },
];

export default function SiteControls() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState("rose");
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("bvm-theme") as "light" | "dark") || "light";
    const savedAccent = localStorage.getItem("bvm-accent") || "rose";
    setTheme(savedTheme);
    setAccent(savedAccent);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-accent", savedAccent);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("bvm-theme", next);
  }

  function pickAccent(id: string) {
    setAccent(id);
    document.documentElement.setAttribute("data-accent", id);
    localStorage.setItem("bvm-accent", id);
  }

  const dateLabel = now ? formatISTDate(now) : "";
  const time12Label = now ? formatISTTime12(now) : "";
  const time24Label = now ? formatISTTime24(now) : "";

  return (
    <div className={`site-controls ${open ? "open" : ""}`}>
      {open && (
        <div className="site-controls-panel" role="group" aria-label="Display settings">
          <div className="site-controls-clock" aria-live="off">
            <span className="site-controls-time">{time24Label}</span>
            <span className="site-controls-time-12">{time12Label} IST</span>
            <span className="site-controls-date">{dateLabel}</span>
          </div>
          <button type="button" className="site-controls-row" onClick={toggleTheme} aria-pressed={theme === "dark"}>
            <span>{theme === "light" ? "☀️ Day mode" : "🌙 Night mode"}</span>
            <span className="site-controls-switch" data-on={theme === "dark"}><i /></span>
          </button>
          <div className="site-controls-swatches" role="group" aria-label="Accent colour">
            {ACCENTS.map(a => (
              <button key={a.id} type="button" className="swatch" data-active={accent === a.id} style={{ background: a.color }} aria-label={`${a.id} accent`} onClick={() => pickAccent(a.id)} />
            ))}
          </div>
          <a className="site-controls-admin" href="/admin">🔐 Admin panel</a>
        </div>
      )}
      <button type="button" className="site-controls-toggle" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Toggle display settings">
        {open ? "✕" : "⚙"}
      </button>
    </div>
  );
}
