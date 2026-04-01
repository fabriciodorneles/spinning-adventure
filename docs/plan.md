# Spinning Adventure — Plano de Desenvolvimento

## Visão

App gamificado para conexão com bike de spinning (Sport02-0AEA via BLE/FTMS).
No futuro: jogo motivante com corridas, rankings e interações entre usuários.

## Fases

| Fase | Nome | Objetivo |
|------|------|----------|
| -1 | MVP Real-time | Dashboard ao vivo + salvar treinos |
| 0  | Gamificação básica | Pontuação, metas, histórico visual |
| 1+ | Multi-usuário, corridas, social | Escala, interação |

---

## Fase -1 — MVP (implementado)

### Stack
- **BLE Bridge**: Python (`bike-bridge/bridge.py`)
- **Frontend + Backend**: Next.js 16 (App Router, TypeScript)
- **Tempo real**: Python WS `:8765` → Socket.io (custom server) → React
- **Banco**: SQLite via `better-sqlite3` (`spinning.db`)

### Fluxo de dados
```
Bike (BLE) → bridge.py (WS :8765) → server.ts (Socket.io) → React
                                            ↓
                                      SQLite (workouts)
```

### Telas
| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `app/page.tsx` | Dashboard ao vivo com métricas em tempo real |
| `/workouts` | `app/workouts/page.tsx` | Histórico de treinos em tabela |

### Métricas por treino (SQLite `workouts`)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `avg_speed` | REAL | Velocidade média (km/h) |
| `avg_power` | REAL | Potência média (W) |
| `avg_cadence` | REAL | Cadência média (rpm) |
| `max_speed` | REAL | Velocidade máxima (km/h) |
| `max_power` | REAL | Potência máxima (W) |
| `work_j` | REAL | Trabalho mecânico: `avg_power × duration_sec` (J) |

### Coleta para médias
- Cada notificação BLE (~1s) gera uma amostra
- Amostras acumuladas em memória durante treino ativo
- Médias correntes (`running_avg_speed`, `running_avg_power`) calculadas a cada amostra e enviadas via `bike:data`
- Ao parar: calcula médias/máximos finais, `work_j`, e persiste no SQLite

### Para rodar
```bash
# Terminal 1 — Bridge Python
pip install -r bike-bridge/requirements.txt
python bike-bridge/bridge.py

# Terminal 2 — Web
cd web
npm install
npm run dev
```

Abrir http://localhost:3000

---

## Fase 0 — Gamificação básica (planejado)

- Sistema de pontuação por treino (potência × tempo)
- Gráficos de evolução (histórico visual)
- Metas semanais
- Badges/conquistas simples

## Fase 1+ — Multi-usuário (planejado)

- Auth (NextAuth ou similar)
- PostgreSQL (migrar do SQLite)
- Corridas ao vivo entre usuários
- Rankings e interações sociais
