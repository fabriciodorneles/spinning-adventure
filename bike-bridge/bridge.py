"""
bridge.py — BLE bike → WebSocket server

Conecta à bike via BLE/FTMS e serve os dados em tempo real
via WebSocket na porta 8765 (ws://localhost:8765).

Uso:
    python bike-bridge/bridge.py
"""

import asyncio
import json
import logging

import websockets
from bleak import BleakClient, BleakError
from pycycling.fitness_machine_service import FitnessMachineService

DEVICE_ADDRESS = "FA:05:11:15:14:F4"
WS_PORT = 8765
RECONNECT_DELAY = 5  # segundos entre tentativas de reconexão

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# Clientes WebSocket conectados
connected_clients: set = set()


def make_payload(data) -> str:
    fields = [
        "instant_speed",
        "instant_cadence",
        "average_cadence",
        "total_distance",
        "resistance_level",
        "instant_power",
        "average_power",
        "total_energy",
        "energy_per_hour",
        "energy_per_minute",
        "heart_rate",
    ]
    payload = {}
    for field in fields:
        value = getattr(data, field, None)
        if value is not None:
            payload[field] = value
    return json.dumps(payload)


async def broadcast(message: str):
    if not connected_clients:
        return
    await asyncio.gather(
        *[client.send(message) for client in connected_clients],
        return_exceptions=True,
    )


async def ws_handler(websocket):
    connected_clients.add(websocket)
    log.info("Cliente WS conectado. Total: %d", len(connected_clients))
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)
        log.info("Cliente WS desconectado. Total: %d", len(connected_clients))


async def ble_loop():
    while True:
        try:
            log.info("Conectando à bike %s...", DEVICE_ADDRESS)
            async with BleakClient(DEVICE_ADDRESS, timeout=20) as client:
                log.info("Conectado à bike.")

                def handler(data):
                    payload = make_payload(data)
                    asyncio.ensure_future(broadcast(payload))

                ftms = FitnessMachineService(client)
                ftms.set_indoor_bike_data_handler(handler)
                await ftms.enable_indoor_bike_data_notify()

                log.info("Streaming dados da bike (Ctrl+C para parar)...")
                # Mantém conectado indefinidamente até cair
                while client.is_connected:
                    await asyncio.sleep(1)

                log.info("Conexão BLE perdida.")

        except BleakError as e:
            log.warning("Erro BLE: %s", e)
        except Exception as e:
            log.error("Erro inesperado: %s", e)

        log.info("Reconectando em %ds...", RECONNECT_DELAY)
        await asyncio.sleep(RECONNECT_DELAY)


async def main():
    log.info("Iniciando servidor WebSocket na porta %d...", WS_PORT)
    async with websockets.serve(ws_handler, "localhost", WS_PORT):
        log.info("WebSocket pronto em ws://localhost:%d", WS_PORT)
        await ble_loop()


if __name__ == "__main__":
    asyncio.run(main())
