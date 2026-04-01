/**
 * server.ts — Custom Next.js server com Socket.io
 *
 * Responsabilidades:
 * 1. Iniciar o Next.js app normalmente
 * 2. Anexar Socket.io ao mesmo servidor HTTP
 * 3. Conectar ao bridge Python (ws://localhost:8765) e repassar dados para os clientes React
 * 4. Gerenciar estado do treino (start/stop) e amostras em memória
 */

import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import WebSocket from "ws";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const BRIDGE_URL = "ws://localhost:8765";
const BRIDGE_RECONNECT_MS = 5000;

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ---------- Estado do treino ----------
interface Sample {
  timestamp: number;
  instant_speed?: number;
  instant_power?: number;
  instant_cadence?: number;
  resistance_level?: number;
  heart_rate?: number;
  total_energy?: number;
}

interface WorkoutState {
  active: boolean;
  startedAt: number | null;
  samples: Sample[];
}

const workout: WorkoutState = {
  active: false,
  startedAt: null,
  samples: [],
};

// ---------- Conexão com o bridge Python ----------
function connectToBridge(io: SocketIOServer) {
  let ws: WebSocket | null = null;

  function connect() {
    console.log("[bridge] Conectando ao Python bridge em", BRIDGE_URL);
    ws = new WebSocket(BRIDGE_URL);

    ws.on("open", () => {
      console.log("[bridge] Conectado ao Python bridge.");
    });

    ws.on("message", (raw: WebSocket.RawData) => {
      try {
        const data = JSON.parse(raw.toString());

        // Acumula amostra se treino estiver ativo
        if (workout.active) {
          workout.samples.push({ timestamp: Date.now(), ...data });

          // Calcula médias em tempo real e injeta nos dados
          const avgSpeed = runningAvg(workout.samples, "instant_speed");
          const avgPower = runningAvg(workout.samples, "instant_power");
          if (avgSpeed !== null) data.running_avg_speed = avgSpeed;
          if (avgPower !== null) data.running_avg_power = avgPower;

          // Trabalho acumulado: potência média × segundos decorridos
          if (avgPower !== null && workout.startedAt !== null) {
            const elapsedSec = (Date.now() - workout.startedAt) / 1000;
            data.running_work_j = avgPower * elapsedSec;
          }
        }

        // Repassa para todos os clientes React conectados
        io.emit("bike:data", data);
      } catch {
        // ignora payloads malformados
      }
    });

    ws.on("close", () => {
      console.log(
        `[bridge] Conexão perdida. Reconectando em ${BRIDGE_RECONNECT_MS / 1000}s...`
      );
      setTimeout(connect, BRIDGE_RECONNECT_MS);
    });

    ws.on("error", (err: Error) => {
      console.error("[bridge] Erro WebSocket:", err.message);
      ws?.terminate();
    });
  }

  connect();
}

// ---------- Eventos Socket.io vindos do cliente React ----------
function registerSocketEvents(io: SocketIOServer) {
  io.on("connection", (socket) => {
    console.log("[socket.io] Cliente conectado:", socket.id);

    // Envia estado atual do treino ao conectar
    socket.emit("workout:state", {
      active: workout.active,
      startedAt: workout.startedAt,
    });

    socket.on("workout:start", () => {
      if (workout.active) return;
      workout.active = true;
      workout.startedAt = Date.now();
      workout.samples = [];
      console.log("[treino] Iniciado em", new Date(workout.startedAt).toISOString());
      io.emit("workout:state", { active: true, startedAt: workout.startedAt });
    });

    socket.on("workout:stop", async () => {
      if (!workout.active) return;
      workout.active = false;
      const endedAt = Date.now();
      console.log("[treino] Finalizado em", new Date(endedAt).toISOString());

      const summary = buildSummary(workout, endedAt);

      // Persiste no banco via API interna
      try {
        await fetch(`http://localhost:${PORT}/api/workouts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(summary),
        });
      } catch (err) {
        console.error("[treino] Erro ao salvar treino:", err);
      }

      io.emit("workout:state", { active: false, startedAt: null });
      io.emit("workout:summary", summary);

      // Reset
      workout.startedAt = null;
      workout.samples = [];
    });

    socket.on("disconnect", () => {
      console.log("[socket.io] Cliente desconectado:", socket.id);
    });
  });
}

function runningAvg(samples: Sample[], key: keyof Sample): number | null {
  const vals = samples
    .map((s) => s[key] as number | undefined)
    .filter((v): v is number => v !== undefined && v !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function buildSummary(state: WorkoutState, endedAt: number) {
  const { samples, startedAt } = state;
  const durationSec = startedAt ? Math.round((endedAt - startedAt) / 1000) : 0;

  const avg = (key: keyof Sample) => {
    const vals = samples
      .map((s) => s[key] as number | undefined)
      .filter((v): v is number => v !== undefined && v !== null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const max = (key: keyof Sample) => {
    const vals = samples
      .map((s) => s[key] as number | undefined)
      .filter((v): v is number => v !== undefined && v !== null);
    if (!vals.length) return null;
    return Math.max(...vals);
  };

  const avgPower = avg("instant_power");

  return {
    started_at: startedAt ? new Date(startedAt).toISOString() : null,
    ended_at: new Date(endedAt).toISOString(),
    duration_sec: durationSec,
    avg_speed: avg("instant_speed"),
    avg_power: avgPower,
    avg_cadence: avg("instant_cadence"),
    max_speed: max("instant_speed"),
    max_power: max("instant_power"),
    work_j: avgPower != null ? avgPower * durationSec : null,
    samples: JSON.stringify(samples),
  };
}

// ---------- Bootstrap ----------
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  connectToBridge(io);
  registerSocketEvents(io);

  httpServer.listen(PORT, () => {
    console.log(
      `> Next.js pronto em http://localhost:${PORT} [${dev ? "dev" : "production"}]`
    );
  });
});
