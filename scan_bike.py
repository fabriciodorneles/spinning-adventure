import asyncio
from bleak import BleakScanner

async def main():
    print("Escaneando dispositivos BLE por 10 segundos...")
    devices = await BleakScanner.discover(timeout=10.0)

    for d in devices:
        print(f"Nome: {d.name} | Endereço: {d.address}")

asyncio.run(main())