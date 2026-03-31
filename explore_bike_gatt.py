"""Lista serviços e características BLE após conectar — útil para ver se o FTMS está completo."""

import asyncio
import sys

from bleak import BleakClient

DEVICE_ADDRESS = "FA:05:91:17:0A:EA"


async def main():
    addr = sys.argv[1] if len(sys.argv) > 1 else DEVICE_ADDRESS
    print(f"Conectando em {addr}...")
    async with BleakClient(addr, timeout=25) as client:
        print("Conectado.\n")
        for svc in client.services:
            print(f"Serviço: {svc.uuid}")
            for ch in svc.characteristics:
                props = ", ".join(ch.properties) if ch.properties else "(sem props)"
                print(f"  Característica: {ch.uuid}")
                print(f"    Propriedades: {props}")
            print()


if __name__ == "__main__":
    asyncio.run(main())
