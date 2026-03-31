import asyncio

from bleak import BleakClient
from pycycling.fitness_machine_service import FitnessMachineService

DEVICE_ADDRESS = "FA:05:91:17:0A:EA"  # Sport02-0AEA

CAMPOS = [
    ("instant_speed",      "Velocidade instantânea", "km/h"),
    ("instant_cadence",    "Cadência instantânea",   "rpm"),
    ("average_cadence",    "Cadência média",         "rpm"),
    ("total_distance",     "Distância total",        "m"),
    ("resistance_level",   "Nível de resistência",   ""),
    ("instant_power",      "Potência instantânea",   "W"),
    ("average_power",      "Potência média",         "W"),
    ("total_energy",       "Energia total",          "kcal"),
    ("energy_per_hour",    "Energia por hora",       "kcal/h"),
    ("energy_per_minute",  "Energia por minuto",     "kcal/min"),
    ("heart_rate",         "Frequência cardíaca",    "bpm"),
]


def exibir_dados(data):
    linhas = []
    for attr, label, unidade in CAMPOS:
        valor = getattr(data, attr, None)
        if valor is not None:
            suffix = f" {unidade}" if unidade else ""
            linhas.append(f"  {label}: {valor}{suffix}")
    if linhas:
        print("\n".join(linhas))
        print("-" * 40)


async def main():
    print("Conectando na bike...")
    async with BleakClient(DEVICE_ADDRESS, timeout=20) as client:
        print("Conectado. Recebendo dados (Ctrl+C para parar)...\n")

        ftms = FitnessMachineService(client)
        ftms.set_indoor_bike_data_handler(exibir_dados)
        await ftms.enable_indoor_bike_data_notify()

        await asyncio.sleep(60)


asyncio.run(main())
