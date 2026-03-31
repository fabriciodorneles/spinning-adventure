# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Python BLE client for reading fitness data from an indoor cycling bike (Sport02-0AEA) via the Bluetooth Fitness Machine Service (FTMS) protocol.

## Dependencies

- `bleak` — cross-platform BLE library
- `pycycling` — FTMS/cycling protocol implementations

Install with:
```bash
pip install bleak pycycling
```

## Running the Scripts

```bash
# Scan for nearby BLE devices
python scan_bike.py

# Explore GATT services/characteristics of a device
python explore_bike_gatt.py [DEVICE_ADDRESS]

# Connect to the bike and stream live metrics for 60 seconds
python test_bike.py
```

## Architecture

Three-script workflow:
1. **scan_bike.py** — discovers BLE devices and prints their name/MAC address
2. **explore_bike_gatt.py** — connects and enumerates all GATT services and characteristics (useful for debugging protocol support); accepts an optional MAC address as `sys.argv[1]`, falls back to the hardcoded address
3. **test_bike.py** — connects via `BleakClient`, wraps it in `pycycling.FitnessMachineService`, registers a notification handler for indoor bike data (speed, cadence, power, resistance, etc.), and streams for 60 seconds

All scripts use `asyncio` + `async with BleakClient(...)` for BLE connections. The target device address `FA:05:91:17:0A:EA` (Sport02-0AEA) is hardcoded in all three files.
