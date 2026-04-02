"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { WorkoutTimer } from "@/components/WorkoutTimer";
import { TrackGame } from "@/components/TrackGame";

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
  const [simMode, setSimMode] = useState(false);

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

    socket.on("sim:mode", (enabled: boolean) => setSimMode(enabled));

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

  function sendSimCmd(cmd: string) {
    socketRef.current?.emit("sim:cmd", cmd);
  }

  function formatMin(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,480px)_1fr] gap-8 max-w-7xl mx-auto">

        {/* ── Coluna esquerda — métricas ── */}
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between w-full">
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
          <div className="grid grid-cols-2 gap-4 w-full">
            <MetricCard label="Potência" value={bikeData.instant_power} unit="W" large />
            <MetricCard label="Velocidade" value={bikeData.instant_speed} unit="km/h" large />
          </div>

          {/* Métricas secundárias */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <MetricCard label="Cadência" value={bikeData.instant_cadence} unit="rpm" />
            <MetricCard label="Resistência" value={bikeData.resistance_level} unit="" />
            <MetricCard label="FC" value={bikeData.heart_rate} unit="bpm" />
          </div>

          {/* Métricas de sessão */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <MetricCard label="Energia" value={bikeData.total_energy} unit="kcal" />
            <MetricCard label="Pot. média" value={bikeData.running_avg_power ?? bikeData.average_power} unit="W" />
            <MetricCard label="Vel. média" value={bikeData.running_avg_speed} unit="km/h" />
          </div>

          {/* Trabalho acumulado */}
          <div className="w-full">
            <MetricCard
              label="Trabalho"
              value={bikeData.running_work_j != null ? bikeData.running_work_j / 1000 : null}
              unit="kJ"
            />
          </div>

          {/* Botão Start/Stop */}
          <button
            onClick={toggleWorkout}
            className={`w-full py-4 rounded-2xl text-xl font-bold tracking-wide transition-colors ${
              workoutActive
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            }`}
          >
            {workoutActive ? "⏹ Parar treino" : "▶ Iniciar treino"}
          </button>

          {/* Resumo do último treino */}
          {lastSummary && (
            <div className="w-full bg-gray-900 rounded-2xl p-5 space-y-2">
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
        </div>

        {/* ── Coluna direita — jogo ── */}
        <div className="flex flex-col gap-4">
          <TrackGame workJ={bikeData.running_work_j} active={workoutActive} />
        </div>

      </div>

      {/* Painel do simulador (fixo, canto inferior direito) */}
      {simMode && (
        <div className="fixed bottom-4 right-4 bg-gray-900 border border-yellow-500 rounded-xl p-3 z-50 flex flex-col gap-2 shadow-xl">
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Simulador</span>
          <div className="flex gap-2">
            <button
              onClick={() => sendSimCmd("sim:start")}
              className="text-xs bg-green-700 hover:bg-green-600 text-white rounded px-2 py-1"
            >
              ▶
            </button>
            <button
              onClick={() => sendSimCmd("sim:stop")}
              className="text-xs bg-red-700 hover:bg-red-600 text-white rounded px-2 py-1"
            >
              ⏹
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => sendSimCmd("sim:power_up")}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white rounded px-2 py-1 font-bold"
            >
              ＋
            </button>
            <button
              onClick={() => sendSimCmd("sim:power_down")}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white rounded px-2 py-1 font-bold"
            >
              －
            </button>
          </div>
          <span className="text-white text-sm font-mono text-center">
            {bikeData.instant_power ?? 0} W
          </span>
        </div>
      )}
    </main>
  );
}
