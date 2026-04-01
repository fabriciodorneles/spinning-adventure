# Architecture Decision Records

## ADR-001: Next.js como full-stack (vs React + Node separados)

**Decisão**: Usar Next.js 16 (App Router) para frontend e backend juntos.

**Motivo**: Reduz configuração inicial, API Routes já integradas, fácil de evoluir. Para MVP de um usuário não há necessidade de backend separado.

**Trade-off**: Custom server necessário para Socket.io (não suportado nativamente no App Router).

---

## ADR-002: Python WebSocket server como bridge BLE

**Decisão**: `bridge.py` sobe um servidor WebSocket local (`:8765`). Node conecta como cliente WS e repassa via Socket.io.

**Motivo**: Desacoplamento claro entre a camada BLE (Python/bleak) e a camada web (Node). Python gerencia reconexão BLE; Node gerencia clientes React.

**Alternativa descartada**: Node spawnar Python como subprocess (mais acoplado, harder to debug).

---

## ADR-003: SQLite para fase -1

**Decisão**: `better-sqlite3` com arquivo local `spinning.db`.

**Motivo**: Zero configuração de servidor, fácil de inspecionar, suficiente para um usuário. Schema pode ser migrado para PostgreSQL na Fase 1.

---

## ADR-004: Amostras coletadas a cada notificação BLE (~1s)

**Decisão**: Acumular todas as amostras em memória durante o treino, calcular médias/máximos no evento `workout:stop`.

**Motivo**: BLE FTMS já emite ~1 notificação/segundo. Não precisamos de timer adicional. Médias calculadas server-side garantem consistência.

**Nota**: Amostras brutas são salvas como JSON no campo `samples` para análise futura.

---

## ADR-005: Médias em tempo real calculadas no server, não na bike

**Decisão**: `running_avg_speed` e `running_avg_power` são calculados em `server.ts` a cada amostra e injetados no payload `bike:data`.

**Motivo**: A Sport02 não envia `average_power` via FTMS. Calcular no server centraliza a lógica e evita estado duplicado no React.

**Trade-off**: O cálculo percorre todos os samples a cada mensagem (O(n)). Para treinos de até ~1h (~3600 amostras) isso é imperceptível.

---

## ADR-006: Métrica `work_j` = potência média × duração

**Decisão**: Salvar `work_j = avg_power * duration_sec` (Joules) em cada treino. Exibir em kJ no histórico.

**Motivo**: Joule é a unidade física de trabalho mecânico (W × s). Permite comparar esforço entre treinos de durações diferentes — dois treinos com mesma potência média mas durações diferentes terão `work_j` proporcionais. Serve como base para pontuação na Fase 0.
