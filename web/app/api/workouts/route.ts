import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const workouts = db
    .prepare(
      `SELECT id, started_at, ended_at, duration_sec,
              avg_speed, avg_power, avg_cadence, max_speed, max_power, work_j
       FROM workouts
       ORDER BY id DESC
       LIMIT 50`
    )
    .all();

  return Response.json(workouts);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    started_at,
    ended_at,
    duration_sec,
    avg_speed,
    avg_power,
    avg_cadence,
    max_speed,
    max_power,
    work_j,
    samples,
  } = body;

  if (!started_at || !ended_at || duration_sec == null) {
    return new Response("Campos obrigatórios ausentes", { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO workouts
         (started_at, ended_at, duration_sec, avg_speed, avg_power, avg_cadence, max_speed, max_power, work_j, samples)
       VALUES
         (@started_at, @ended_at, @duration_sec, @avg_speed, @avg_power, @avg_cadence, @max_speed, @max_power, @work_j, @samples)`
    )
    .run({
      started_at,
      ended_at,
      duration_sec,
      avg_speed: avg_speed ?? null,
      avg_power: avg_power ?? null,
      avg_cadence: avg_cadence ?? null,
      max_speed: max_speed ?? null,
      max_power: max_power ?? null,
      work_j: work_j ?? null,
      samples: samples ?? null,
    });

  return Response.json({ id: result.lastInsertRowid }, { status: 201 });
}
