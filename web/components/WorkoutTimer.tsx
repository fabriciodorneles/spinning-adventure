"use client";

import { useEffect, useState } from "react";

interface WorkoutTimerProps {
  startedAt: number | null;
  active: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(String(h).padStart(2, "0"));
  parts.push(String(m).padStart(2, "0"));
  parts.push(String(s).padStart(2, "0"));
  return parts.join(":");
}

export function WorkoutTimer({ startedAt, active }: WorkoutTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) return;

    const tick = () => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  const display = active && startedAt ? elapsed : 0;

  return (
    <div className="flex flex-col items-center">
      <span className="text-gray-400 text-sm uppercase tracking-widest">Tempo</span>
      <span className="font-mono text-5xl font-bold text-white tabular-nums">
        {formatDuration(display)}
      </span>
    </div>
  );
}
