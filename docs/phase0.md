# Fase 0 — Gamificação básica

## Objetivos

| Item | Status |
|------|--------|
| Trabalho (kJ) como métrica de esforço | ✅ Fase -1 |
| Representação gráfica da pista | ✅ Fase 0 |
| Simulador dev (sem bike física) | ✅ Fase 0 |
| Gráficos de evolução histórica | Fase 0+ |
| Metas semanais | Fase 0+ |
| Badges/conquistas | Fase 0+ |

---

## Features entregues

### Pista (TrackGame)

Componente SVG puro (`web/components/TrackGame.tsx`). Zero dependências novas.

- Pista horizontal com dois trilhos
- Rider (🚴) se move conforme `running_work_j` acumulado durante o treino
- Marcadores a cada 1 kJ dentro do trecho atual
- A cada **10 kJ** (MILESTONE_J = 10.000 J): avança para o próximo trecho com flash de celebração 🎉
- Estado inativo: tudo em cinza, rider na largada
- Responsivo via `viewBox="0 0 800 160" width="100%"`

**Fórmula de posição:**
```
positionRatio = (running_work_j % 10_000) / 10_000
riderX = 40 + positionRatio * 720
```

### Layout duas colunas

`web/app/page.tsx` agora usa:
```
grid-cols-1 lg:grid-cols-[minmax(420px,480px)_1fr]
```
- Esquerda: todas as métricas + controles de treino
- Direita: pista de jogo
- Mobile: empilha verticalmente (pista abaixo das métricas)

### Simulador de dev

`bike-bridge/simulator.py` — substitui `bridge.py` quando a bike não está disponível.

```bash
# Modo real:
python bike-bridge/bridge.py

# Modo dev:
python bike-bridge/simulator.py
```

Ao conectar ao simulador, a UI exibe automaticamente um painel amarelo no canto inferior direito com controles:
- ▶ / ⏹ — liga/desliga geração de dados
- ＋ / － — sobe/desce 20W (range: 0–300W)

**Detecção:** o simulador envia `"_sim": true` em cada mensagem. O `server.ts` intercepta, remove o campo antes de repassar ao React, e emite `sim:mode = true` via Socket.io.

---

## Arquitetura

```
simulator.py
  asyncio loop:
    ├── ws_handler(websocket) — recebe comandos de cada cliente
    └── data_generation_loop() — emite payload a cada 1s quando running=True
```

**Fórmulas de simulação:**
| Campo | Fórmula |
|-------|---------|
| `instant_speed` | `power × 0.1` km/h |
| `instant_cadence` | `60 + power × 0.3` rpm |
| `resistance_level` | `clamp(power ÷ 15, 1, 20)` |
| `heart_rate` | `120 + power × 0.2` bpm |
| `total_energy` | acumula `power / 4184` kcal/s |

---

## Decisões de arquitetura

**SVG puro em vez de canvas/game engine:** zero dependências, fácil de manter, suficiente para a fase atual. Pode ser evoluído para canvas se necessário.

**`_sim` flag no payload:** padrão simples para distinguir fonte real vs simulada sem alterar contratos de API ou criar endpoints separados.

**`bridgeWs` module-scope em server.ts:** permite que `registerSocketEvents` encaminhe `sim:cmd` ao bridge Python sem reestruturar a arquitetura de funções existente.

**Milestone = 10 kJ:** a 100W de potência média, 10 kJ = 100s ≈ 1:40 min. Ritmo razoável para feedback de progresso sem ser nem rápido demais nem lento demais.
