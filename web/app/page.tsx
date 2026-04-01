"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { WorkoutTimer } from "@/components/WorkoutTimer";

interface BikeData {
  instant_speed?: number;
  instant_cadence?: number;
  instant_power?: number;
  resistance_level?: number;
  heart_rate?: number;
  total_energy?: number;
  average_power?: number;
  average_cadence?: number;
  running_avg_speed?: number;
  running_avg_power?: number;
  running_work_j?: number;
}

interface WorkoutSummary {
  duration_sec: number;
  avg_speed: number | null;
  avg_power: number | null;
  avg_cadence: number | null;
  max_speed: number | null;
  max_power: number | null;
}

export default function Dashboard() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [bikeData, setBikeData] = useState<BikeData>({});
  const [workoutActive, setWorkoutActive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastSummary, setLastSummary] = useState<WorkoutSummary | null>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("bike:data", (data: BikeData) => {
      setBikeData(data);
    });

    socket.on(
      "workout:state",
      ({ active, startedAt }: { active: boolean; startedAt: number | null }) => {
        setWorkoutActive(active);
        setStartedAt(startedAt);
      }
    );

    socket.on("workout:summary", (summary: WorkoutSummary) => {
      setLastSummary(summary);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function toggleWorkout() {
    if (!socketRef.current) return;
    if (workoutActive) {
      socketRef.current.emit("workout:stop");
      setLastSummary(null);
    } else {
      socketRef.current.emit("workout:start");
    }
  }

  function formatMin(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-8 gap-8">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Spinning Adventure</h1>
          <span
            className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`}
            title={connected ? "Conectado" : "Desconectado"}
          />
        </div>
        <Link
          href="/workouts"
          className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          Histórico
        </Link>
      </div>

      {/* Timer */}
      <WorkoutTimer startedAt={startedAt} active={workoutActive} />

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <MetricCard label="Potência" value={bikeData.instant_power} unit="W" large />
        <MetricCard label="Velocidade" value={bikeData.instant_speed} unit="km/h" large />
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        <MetricCard label="Cadência" value={bikeData.instant_cadence} unit="rpm" />
        <MetricCard label="Resistência" value={bikeData.resistance_level} unit="" />
        <MetricCard label="FC" value={bikeData.heart_rate} unit="bpm" />
      </div>

      {/* Métricas de sessão */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-md">
        <MetricCard label="Energia" value={bikeData.total_energy} unit="kcal" />
        <MetricCard label="Pot. média" value={bikeData.running_avg_power ?? bikeData.average_power} unit="W" />
        <MetricCard label="Vel. média" value={bikeData.running_avg_speed} unit="km/h" />
      </div>

      {/* Trabalho acumulado */}
      <div className="w-full max-w-md">
        <MetricCard
          label="Trabalho"
          value={bikeData.running_work_j != null ? bikeData.running_work_j / 1000 : null}
          unit="kJ"
        />
      </div>

      {/* Botão Start/Stop */}
      <button
        onClick={toggleWorkout}
        className={`w-full max-w-md py-4 rounded-2xl text-xl font-bold tracking-wide transition-colors ${
          workoutActive
            ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
            : "bg-green-600 hover:bg-green-700 active:bg-green-800"
        }`}
      >
        {workoutActive ? "⏹ Parar treino" : "▶ Iniciar treino"}
      </button>

      {/* Resumo do último treino */}
      {lastSummary && (
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-5 space-y-2">
          <h2 className="text-lg font-semibold text-gray-200">Último treino salvo</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-300">
            <span>Duração</span>
            <span className="text-white font-mono">{formatMin(lastSummary.duration_sec)}</span>
            <span>Vel. média</span>
            <span className="text-white font-mono">
              {lastSummary.avg_speed?.toFixed(1) ?? "—"} km/h
            </span>
            <span>Pot. média</span>
            <span className="text-white font-mono">
              {lastSummary.avg_power?.toFixed(0) ?? "—"} W
            </span>
            <span>Pot. máx.</span>
            <span className="text-white font-mono">
              {lastSummary.max_power?.toFixed(0) ?? "—"} W
            </span>
            <span>Cad. média</span>
            <span className="text-white font-mono">
              {lastSummary.avg_cadence?.toFixed(0) ?? "—"} rpm
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
