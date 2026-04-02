"""
simulator.py — Simulador de bike para dev/testes

Substitui o bridge.py quando a bike física não está disponível.
Roda na mesma porta (8765) — execute UM ou OUTRO, nunca os dois.

Uso:
    python bike-bridge/simulator.py

Controles (via painel na UI ou WS direto):
    sim:start       → inicia geração de dados
    sim:stop        → pausa geração de dados
    sim:power_up    → +20W (máx 300W)
    sim:power_down  → -20W (mín 0W)
"""

import asyncio
import json
import logging

import websockets

WS_PORT = 8765

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

connected_clients: set = set()

sim_state = {
    "running": False,
    "power": 100,          # watts
    "total_energy": 0.0,   # kcal acumulado
}


def handle_command(cmd: str) -> None:
    cmd = cmd.strip()
    if cmd == "sim:start":
        sim_state["running"] = True
        log.info("Simulador iniciado (power=%dW)", sim_state["power"])
    elif cmd == "sim:stop":
        sim_state["running"] = False
        log.info("Simulador parado")
    elif cmd == "sim:power_up":
        sim_state["power"] = min(300, sim_state["power"] + 20)
        log.info("Potência: %dW", sim_state["power"])
    elif cmd == "sim:power_down":
        sim_state["power"] = max(0, sim_state["power"] - 20)
        log.info("Potência: %dW", sim_state["power"])
    else:
        log.debug("Comando desconhecido: %s", cmd)


async def ws_handler(websocket) -> None:
    connected_clients.add(websocket)
    log.info("Cliente conectado. Total: %d", len(connected_clients))
    # Handshake imediato: informa ao server.ts que é um simulador
    await websocket.send(json.dumps({"_sim": True}))
    try:
        async for message in websocket:
            handle_command(message)
    finally:
        connected_clients.discard(websocket)
        log.info("Cliente desconectado. Total: %d", len(connected_clients))


async def data_generation_loop() -> None:
    while True:
        await asyncio.sleep(1)

        if not sim_state["running"] or not connected_clients:
            continue

        power = sim_state["power"]
        speed = round(power * 0.1, 2)                   # km/h
        cadence = round(60 + power * 0.3, 1)            # rpm
        resistance = max(1, min(20, power // 15))       # nível 1–20
        heart_rate = 120 + int(power * 0.2)             # bpm simulado

        # 1W × 1s = 1J ≈ 1/4184 kcal (eficiência ~25%)
        sim_state["total_energy"] += power / 4184.0

        payload = {
            "instant_speed": speed,
            "instant_cadence": cadence,
            "instant_power": float(power),
            "resistance_level": int(resistance),
            "heart_rate": heart_rate,
            "total_energy": round(sim_state["total_energy"], 4),
            "average_power": float(power),
            "average_cadence": cadence,
            "_sim": True,
        }

        msg = json.dumps(payload)
        await asyncio.gather(
            *[c.send(msg) for c in connected_clients],
            return_exceptions=True,
        )


async def main() -> None:
    log.info("Simulador WS iniciando na porta %d...", WS_PORT)
    async with websockets.serve(ws_handler, "localhost", WS_PORT):
        log.info("Simulador pronto em ws://localhost:%d", WS_PORT)
        log.info("Use o painel da UI ou envie: sim:start, sim:stop, sim:power_up, sim:power_down")
        await data_generation_loop()


if __name__ == "__main__":
    asyncio.run(main())
