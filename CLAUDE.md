# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spinning Adventure — app gamificado para conexão com bike de spinning (Sport02-0AEA via BLE/FTMS).

**Fase atual: -1 (MVP)**
- Dashboard React em tempo real com métricas da bike
- Botão de Start/Stop para treinos
- Persistência de treinos em SQLite

## Architecture

```
Bike (BLE) → bike-bridge/bridge.py (WS :8765) → web/server.ts (Socket.io) → React
                                                          ↓
                                                    SQLite (spinning.db)
```

### Estrutura de pastas

```
spinning-adventure/
├── bike-bridge/
│   ├── bridge.py           ← Servidor WebSocket + cliente BLE (Python)
│   └── requirements.txt
├── web/                    ← Next.js 16 (App Router, TypeScript)
│   ├── server.ts           ← Custom server com Socket.io
│   ├── app/
│   │   ├── page.tsx        ← Dashboard (Client Component)
│   │   └── api/workouts/   ← GET + POST treinos
│   ├── lib/db.ts           ← SQLite singleton (better-sqlite3)
│   ├── components/
│   │   ├── MetricCard.tsx
│   │   └── WorkoutTimer.tsx
│   └── tsconfig.server.json
├── docs/
│   ├── plan.md             ← Plano de desenvolvimento por fases
│   └── decisions.md        ← ADRs (Architecture Decision Records)
├── scan_bike.py            ← Utilitário: escaneia dispositivos BLE
├── explore_bike_gatt.py    ← Utilitário: lista serviços GATT do device
└── test_bike.py            ← Script legado de teste (substituído pelo bridge)
```

## Como rodar

### 1. Bridge Python (Terminal 1)
```bash
pip install -r bike-bridge/requirements.txt
python bike-bridge/bridge.py
```

### 2. Web (Terminal 2)
```bash
cd web
npm install
npm run dev
```

Abrir http://localhost:3000

## Utilitários BLE (debug)

```bash
# Escanear dispositivos BLE próximos
python scan_bike.py

# Listar serviços GATT de um device
python explore_bike_gatt.py [DEVICE_ADDRESS]
```

## Dispositivo

- **Endereço BLE**: `FA:05:91:17:0A:EA` (Sport02-0AEA, Decathlon)
- **Protocolo**: FTMS (Fitness Machine Service)

## Stack

- **Python**: `bleak` + `pycycling` + `websockets`
- **Node**: Next.js 16, Socket.io, better-sqlite3, TypeScript
- **Banco**: SQLite local (`web/spinning.db`)

## Convenções

- O `server.ts` usa `tsconfig.server.json` (CommonJS) separado do tsconfig do Next.js
- Dados BLE chegam como objeto com campos opcionais (podem ser `null`/`undefined`)
- Amostras do treino são acumuladas em memória no servidor e salvas ao parar
