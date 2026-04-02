"use client";

import { useEffect, useRef, useState } from "react";

interface TrackGameProps {
  workJ: number | undefined;
  active: boolean;
}

const TRACK_X1 = 40;
const TRACK_X2 = 760;
const TRACK_WIDTH = TRACK_X2 - TRACK_X1; // 720
const MILESTONE_J = 10_000; // 10 kJ por trecho

export function TrackGame({ workJ, active }: TrackGameProps) {
  const [celebrating, setCelebrating] = useState(false);
  const prevMilestone = useRef(0);

  // Detecta cruzamento de milestone
  useEffect(() => {
    if (!active || workJ == null) {
      prevMilestone.current = 0;
      return;
    }
    const current = Math.floor(workJ / MILESTONE_J);
    if (current > prevMilestone.current) {
      prevMilestone.current = current;
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 2000);
      return () => clearTimeout(t);
    }
  }, [workJ, active]);

  const safeWorkJ = active && workJ != null ? workJ : 0;
  const currentMilestone = Math.floor(safeWorkJ / MILESTONE_J);
  const positionRatio = active ? (safeWorkJ % MILESTONE_J) / MILESTONE_J : 0;
  const riderX = TRACK_X1 + positionRatio * TRACK_WIDTH;

  const trackColor = active ? "#555" : "#2a2a2a";
  const riderFill = active ? "#22c55e" : "#374151";
  const riderStroke = active ? "#86efac" : "#4b5563";

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-gray-400 text-sm uppercase tracking-widest text-center">
        Pista
      </h2>
      <svg
        viewBox="0 0 800 160"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-2xl"
      >
        {/* Fundo */}
        <rect width="800" height="160" fill="#111" rx="16" />

        {/* Label do trecho atual */}
        {active ? (
          <text x="50" y="28" fill="#facc15" fontSize="13" fontWeight="bold">
            Trecho {currentMilestone + 1} — Meta: {(currentMilestone + 1) * 10} kJ
          </text>
        ) : (
          <text x="400" y="60" textAnchor="middle" fill="#374151" fontSize="14">
            Inicie o treino para começar
          </text>
        )}

        {/* Progresso total */}
        <text x="750" y="28" textAnchor="end" fill="#6b7280" fontSize="12">
          {active && workJ != null ? (workJ / 1000).toFixed(1) : "0.0"} kJ total
        </text>

        {/* Trilhos */}
        <line x1={TRACK_X1} y1="110" x2={TRACK_X2} y2="110" stroke={trackColor} strokeWidth="4" />
        <line x1={TRACK_X1} y1="125" x2={TRACK_X2} y2="125" stroke={trackColor} strokeWidth="4" />

        {/* Marcadores de milestone (1kJ a 9kJ dentro do trecho) */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = TRACK_X1 + ((i + 1) / 10) * TRACK_WIDTH;
          return (
            <g key={i}>
              <line x1={x} y1="100" x2={x} y2="135" stroke={trackColor} strokeWidth="1.5" />
              <text x={x} y="96" textAnchor="middle" fill="#4b5563" fontSize="10">
                {i + 1}kJ
              </text>
            </g>
          );
        })}

        {/* Largada */}
        <text x={TRACK_X1} y="148" textAnchor="middle" fontSize="16">
          🏁
        </text>

        {/* Chegada (próximo milestone) */}
        <text x={TRACK_X2} y="148" textAnchor="middle" fontSize="16">
          ⭐
        </text>

        {/* Rider */}
        <circle
          cx={riderX}
          cy="117"
          r="13"
          fill={riderFill}
          stroke={riderStroke}
          strokeWidth="2"
        />
        <text x={riderX} y="122" textAnchor="middle" fontSize="13" dominantBaseline="auto">
          🚴
        </text>

        {/* Overlay de celebração */}
        {celebrating && (
          <>
            <rect width="800" height="160" rx="16" fill="rgba(250,204,21,0.15)" />
            <text
              x="400"
              y="85"
              textAnchor="middle"
              fontSize="28"
              fontWeight="bold"
              fill="#facc15"
            >
              🎉 +10 kJ!
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
