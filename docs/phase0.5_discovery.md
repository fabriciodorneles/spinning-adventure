# Fase 0.5 — Discovery: Evolução gráfica do jogo

## Objetivo

Evoluir a pista SVG atual para uma experiência visual mais imersiva, estilo **Road Fighter** (pseudo-3D top-down com scroll da pista), com caminho claro para um runner 3D real no futuro.

---

## Referência visual

**Agora (Fase 0):** SVG plano, rider como círculo, pista como linhas horizontais.

**Fase 0.5 (alvo):** Estilo Road Fighter — câmera levemente inclinada, pista scrollando em perspectiva, ciclista com sprite simples, sensação de velocidade proporcional à potência.

**Futuro:** Runner 3D em primeira/terceira pessoa (estilo Subway Surfers ou Temple Run), câmera atrás do ciclista, cenário gerado proceduralmente.

---

## Análise de bibliotecas

| Lib | Prós | Contras | Verdict |
|-----|------|---------|---------|
| **Phaser.js** | Madura, Road Fighter trivial, muitos exemplos | Não é React-native, estado externo ao React, briga com Socket.io | Não recomendado |
| **PixiJS** | Rápido, WebGL 2D, melhor integração React | Foco 2D — para 3D real troca de lib | Razoável para 2D puro |
| **React Three Fiber** | React-native (JSX/hooks), Three.js por baixo, escala para 3D real | Curva inicial maior que Phaser | ✅ **Recomendado** |
| **Unity (WebGL)** | Engine completa, assets profissionais | Integração via iframe/postMessage, pesado, overkill para web | Só se quiser mobile nativo |

---

## Decisão: React Three Fiber (R3F)

**Pacotes:**
```bash
npm install @react-three/fiber @react-three/drei three
npm install -D @types/three
```

**Por que R3F e não Phaser:**
- Componentes são JSX — `<mesh>`, `<perspectiveCamera>`, `<pointLight>` se integram naturalmente com o estado do React (`bikeData`, `workoutActive`)
- Recebe `running_work_j` e `instant_power` como props normais, sem bridges de estado
- Road Fighter = câmera perspectiva com `fov` alto + plano scrollando = ~50 linhas de código
- Runner 3D real = mesma lib, só muda câmera e geometria

**Integração com Unity no futuro (se necessário):**
- Exportar Unity como WebGL → embed via `<iframe>`
- Comunicação via `window.postMessage` (React → Unity) e `addEventListener("message")` (Unity → React)
- Fronteira clara — o jogo vira um módulo isolado

---

## Estratégia de gráficos e assets

### R3F: construção procedural, sem precisar de assets

A grande vantagem do React Three Fiber (Three.js) nesse contexto é que **quase tudo pode ser construído via código**, sem precisar de arquivos de imagem, modelos 3D ou sprites desenhados:

- **Pista** — um `<PlaneGeometry>` com `<MeshStandardMaterial>` e uma textura gerada via shader (linhas de perspectiva, asfalto). Zero arquivos externos.
- **Rider** — pode ser uma composição de primitivas geométricas (`<CylinderGeometry>` para o corpo, `<SphereGeometry>` para a cabeça, `<TorusGeometry>` para as rodas). Simples, estilizado, sem necessidade de modelagem.
- **Cenário** — árvores como cones + cilindros, prédios como boxes, marcos de milestone como arcos feitos de `<TubeGeometry>`. Tudo primitivas.
- **Efeitos** — partículas, motion blur, bloom via `@react-three/postprocessing`. Código puro.
- **Iluminação** — `<ambientLight>`, `<directionalLight>`, sombras — configura o mood da cena inteiro sem assets.

**Conclusão:** para chegar no estilo Road Fighter e até num runner 3D estilizado (não realista), R3F não exige nenhum asset externo. O look fica geométrico/minimalista — o que funciona bem para um app de treino.

---

### Quando assets se tornam necessários

Assets (sprites, modelos `.glb`, texturas `.png`) são necessários quando:
- Você quer um ciclista **reconhecível e animado** (pedalando de verdade)
- Você quer um cenário **realista** (asfalto com textura real, árvores detalhadas)
- Você quer um estilo **pixel art** como o Road Fighter original (requer sprites 2D desenhados)

### Estratégia de assets sem ser designer

Se chegar nesse ponto, existem boas opções:

| Fonte | O que tem | Custo |
|-------|-----------|-------|
| **Sketchfab** | Modelos 3D `.glb` prontos (ciclistas, cenários) | Grátis / pago |
| **Kenney.nl** | Assets 2D e 3D de qualidade, licença CC0 (uso livre) | Grátis |
| **Mixamo (Adobe)** | Personagens 3D com animações prontas (.fbx) | Grátis com conta Adobe |
| **IA (Meshy, Tripo3D)** | Gerar modelo 3D a partir de texto ou imagem | Freemium |
| **IA (Midjourney/DALL-E)** | Gerar texturas e sprites 2D | Pago |

**Recomendação prática:** começar com geometria procedural (sem assets) e, quando a experiência estiver boa em termos de gameplay/feedback, adicionar um modelo `.glb` do Sketchfab ou Kenney para o ciclista. Three.js/R3F carrega `.glb` com uma linha via `useGLTF` do drei.

---

### PixiJS exigiria assets desde o início?

Sim — PixiJS é um renderer 2D baseado em sprites. Para ter algo visual além de retângulos e círculos, você precisa de imagens (spritesheet do ciclista, textura da pista, etc.). Para o estilo Road Fighter original isso faz sentido, mas cria uma dependência de assets desde o dia 1. R3F permite adiar essa decisão.

---

## Roadmap da Fase 0.5

### Etapa 1 — Setup R3F
- Instalar `@react-three/fiber`, `@react-three/drei`, `three`
- Criar `web/components/TrackGame3D.tsx` substituindo o SVG atual
- Canvas R3F dentro de um `<div>` com altura fixa na coluna direita

### Etapa 2 — Pista Road Fighter
- Plano de pista com textura procedural (linhas de perspectiva) ou `<gridHelper>`
- Câmera perspectiva inclinada (~45°), fixa acima e atrás
- Scroll da textura da pista baseado em `instant_power` (mais potência = scroll mais rápido)
- Rider: modelo 3D simples ou sprite billboard

### Etapa 3 — Elementos de jogo
- Marcos de milestone como objetos 3D na pista (cones, arcos)
- Efeito de velocidade (motion blur via shader simples ou `@react-three/postprocessing`)
- Celebração de milestone com partículas (`<Points>` do drei)

### Etapa 4 — Runner 3D (Fase 1+)
- Câmera atrás do ciclista (terceira pessoa)
- Cenário gerado proceduralmente (`useFrame` + instanced meshes)
- Obstáculos/coletáveis baseados em metas de potência

---

## Referências

- Road Fighter (Konami, 1984) — câmera top-down, scroll vertical, ilusão de profundidade
- [React Three Fiber docs](https://docs.pmnd.rs/react-three-fiber)
- [@react-three/drei](https://drei.pmnd.rs/) — helpers prontos: `<Sky>`, `<Environment>`, `<Text3D>`, `<Billboard>`
- [Three.js Journey](https://threejs-journey.com/) — melhor curso de Three.js/R3F

---

## Status

- [ ] Instalar dependências R3F
- [ ] TrackGame3D — pista básica em perspectiva
- [ ] Scroll proporcional à potência
- [ ] Rider 3D simples
- [ ] Milestones como objetos 3D
