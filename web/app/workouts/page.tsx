import Link from "next/link";
import { getDb } from "@/lib/db";

interface Workout {
  id: number;
  started_at: string;
  duration_sec: number;
  avg_speed: number | null;
  avg_power: number | null;
  avg_cadence: number | null;
  max_speed: number | null;
  max_power: number | null;
  work_j: number | null;
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmt(v: number | null, decimals = 1) {
  return v != null ? v.toFixed(decimals) : "—";
}

export default function WorkoutsPage() {
  const workouts = getDb()
    .prepare(
      `SELECT id, started_at, duration_sec,
              avg_speed, avg_power, avg_cadence, max_speed, max_power, work_j
       FROM workouts
       ORDER BY id DESC
       LIMIT 100`
    )
    .all() as Workout[];

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Histórico de treinos</h1>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {workouts.length === 0 ? (
          <p className="text-gray-500 text-center py-16">Nenhum treino salvo ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800">
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-right px-4 py-3">Duração</th>
                  <th className="text-right px-4 py-3">Vel. méd. (km/h)</th>
                  <th className="text-right px-4 py-3">Vel. máx. (km/h)</th>
                  <th className="text-right px-4 py-3">Pot. méd. (W)</th>
                  <th className="text-right px-4 py-3">Pot. máx. (W)</th>
                  <th className="text-right px-4 py-3">Cad. méd. (rpm)</th>
                  <th className="text-right px-4 py-3">Trabalho (kJ)</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((w, i) => (
                  <tr
                    key={w.id}
                    className={`border-b border-gray-800 last:border-0 ${
                      i % 2 === 0 ? "bg-gray-950" : "bg-black"
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {new Date(w.started_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatDuration(w.duration_sec)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(w.avg_speed)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(w.max_speed)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(w.avg_power, 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(w.max_power, 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(w.avg_cadence, 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-yellow-400 font-bold">
                      {w.work_j != null ? (w.work_j / 1000).toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
