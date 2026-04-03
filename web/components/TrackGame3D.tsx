"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const MILESTONE_J = 10_000;
const BASE_SCROLL_SPEED = 0.5; // UV units/sec a 200W
const SCENE_LENGTH = 80;       // distância total do cenário antes de reciclar

// ---------- Textura procedural da pista ----------
function buildRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = "#c9a800";
  ctx.fillRect(0, 0, 18, 512);
  ctx.fillRect(238, 0, 18, 512);
  ctx.fillStyle = "#aaaaaa";
  ctx.fillRect(20, 0, 3, 512);
  ctx.fillRect(233, 0, 3, 512);
  ctx.fillStyle = "#ffffff";
  for (let y = 0; y < 512; y += 80) {
    ctx.fillRect(124, y, 8, 40);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  return texture;
}

// ---------- Cor do gate conforme proximidade ----------
function gateColor(positionRatio: number): string {
  if (positionRatio > 0.85) return "#ffffff";
  if (positionRatio > 0.6) return "#facc15";
  return "#22c55e";
}

// ---------- Árvore ----------
function Tree({ position }: { position: [number, number, number] }) {
  const green = useMemo(
    () => ["#2d6a2d", "#3a8a3a", "#256b25", "#1e5c1e"][Math.floor(Math.random() * 4)],
    []
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1.6, 6]} />
        <meshStandardMaterial color="#5c3d1e" />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshStandardMaterial color={green} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshStandardMaterial color={green} />
      </mesh>
    </group>
  );
}

// ---------- Cogumelo ----------
function Mushroom({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>
      {/* Pintas brancas no chapéu */}
      {[
        [0.15, 0.95, 0.2] as [number, number, number],
        [-0.18, 0.9, 0.1] as [number, number, number],
        [0.05, 1.05, -0.2] as [number, number, number],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Arbusto ----------
function Bush({ position }: { position: [number, number, number] }) {
  const green = useMemo(
    () => ["#3a7a2a", "#4a8c3a", "#2e6622"][Math.floor(Math.random() * 3)],
    []
  );
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.55, 8, 6]} />
        <meshStandardMaterial color={green} />
      </mesh>
      <mesh position={[0.35, 0.25, 0]}>
        <sphereGeometry args={[0.38, 8, 6]} />
        <meshStandardMaterial color={green} />
      </mesh>
      <mesh position={[-0.3, 0.22, 0]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color={green} />
      </mesh>
    </group>
  );
}

// ---------- Lista de objetos de cenário (posições relativas ao longo da pista) ----------
type SceneryItem = {
  x: number;
  baseZ: number;
  type: "tree" | "mushroom" | "bush";
  scale: number;
};

const SCENERY: SceneryItem[] = [
  { x: -8,   baseZ: -5,  type: "tree",     scale: 1.1 },
  { x: -14,  baseZ: -5,  type: "tree",     scale: 0.8 },
  { x:  9,   baseZ: -8,  type: "bush",     scale: 1.0 },
  { x: -9,   baseZ: -16, type: "mushroom", scale: 1.3 },
  { x:  12,  baseZ: -16, type: "tree",     scale: 1.2 },
  { x:  8,   baseZ: -24, type: "tree",     scale: 0.9 },
  { x: -11,  baseZ: -24, type: "bush",     scale: 0.8 },
  { x:  15,  baseZ: -30, type: "mushroom", scale: 1.0 },
  { x: -8,   baseZ: -30, type: "tree",     scale: 1.3 },
  { x:  9,   baseZ: -38, type: "bush",     scale: 1.1 },
  { x: -13,  baseZ: -38, type: "mushroom", scale: 0.9 },
  { x:  13,  baseZ: -46, type: "tree",     scale: 1.0 },
  { x: -9,   baseZ: -46, type: "tree",     scale: 0.85 },
  { x:  8,   baseZ: -54, type: "mushroom", scale: 1.2 },
  { x: -14,  baseZ: -54, type: "bush",     scale: 1.0 },
  { x:  11,  baseZ: -62, type: "tree",     scale: 1.1 },
  { x: -10,  baseZ: -62, type: "bush",     scale: 0.9 },
  { x:  9,   baseZ: -70, type: "mushroom", scale: 1.0 },
  { x: -8,   baseZ: -70, type: "tree",     scale: 1.2 },
];

// ---------- Props do componente principal ----------
interface TrackGame3DProps {
  workJ: number | undefined;
  active: boolean;
  instantPower: number | undefined;
}

// ---------- Cena R3F ----------
interface SceneProps {
  positionRatio: number;
  instantPower: number;
  active: boolean;
  celebrating: boolean;
  currentMilestone: number;
}

function SceneContents({ positionRatio, instantPower, active, celebrating, currentMilestone }: SceneProps) {
  const roadMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const gateGroupRef = useRef<THREE.Group>(null);
  const sceneryRefs = useRef<(THREE.Group | null)[]>([]);
  const scrollAccum = useRef(0);
  const cameraReady = useRef(false);

  const { camera } = useThree();

  const roadTexture = useMemo(() => buildRoadTexture(), []);

  useFrame((state, delta) => {
    // Aponta câmera uma vez ao iniciar
    if (!cameraReady.current) {
      camera.lookAt(0, 0.5, -8);
      cameraReady.current = true;
    }

    // Scroll da pista (UV)
    if (roadMaterialRef.current?.map && active) {
      const speed = (instantPower / 200) * BASE_SCROLL_SPEED;
      (roadMaterialRef.current.map as THREE.Texture).offset.y += speed * delta;
      scrollAccum.current += speed * delta * 20; // converte UV para unidades de mundo
    }

    // Scroll dos objetos do cenário
    sceneryRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const item = SCENERY[i];
      // posição Z = baseZ + acúmulo (módulo SCENE_LENGTH para reciclar)
      const z = item.baseZ + (scrollAccum.current % SCENE_LENGTH);
      // reciclar: se passou atrás da câmera, joga de volta para frente
      const finalZ = z > 8 ? z - SCENE_LENGTH : z;
      ref.position.z = finalZ;
    });

    // Gate
    if (gateGroupRef.current) {
      gateGroupRef.current.position.z = THREE.MathUtils.lerp(-30, 2, positionRatio);
    }
  });

  const color = gateColor(positionRatio);

  return (
    <>
      {/* Céu */}
      <color attach="background" args={["#4a90d9"]} />

      {/* Iluminação */}
      <ambientLight intensity={active ? 1.2 : 0.5} />
      <directionalLight position={[8, 15, 5]} intensity={1.8} castShadow={false} />
      <directionalLight position={[-5, 8, -10]} intensity={0.4} color="#aaddff" />

      {/* Gramado lateral esquerdo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-20, -0.01, -25]}>
        <planeGeometry args={[30, 100]} />
        <meshStandardMaterial color="#3d8c40" />
      </mesh>

      {/* Gramado lateral direito */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, -0.01, -25]}>
        <planeGeometry args={[30, 100]} />
        <meshStandardMaterial color="#3d8c40" />
      </mesh>

      {/* Pista */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -25]}>
        <planeGeometry args={[10, 100]} />
        <meshStandardMaterial ref={roadMaterialRef} map={roadTexture} />
      </mesh>

      {/* Faixas laterais */}
      <mesh position={[-5.5, 0.02, -25]}>
        <boxGeometry args={[0.3, 0.04, 100]} />
        <meshStandardMaterial color="#c9a800" />
      </mesh>
      <mesh position={[5.5, 0.02, -25]}>
        <boxGeometry args={[0.3, 0.04, 100]} />
        <meshStandardMaterial color="#c9a800" />
      </mesh>

      {/* Objetos de cenário */}
      {SCENERY.map((item, i) => (
        <group
          key={i}
          ref={(el) => { sceneryRefs.current[i] = el; }}
          position={[item.x, 0, item.baseZ]}
          scale={item.scale}
        >
          {item.type === "tree"     && <Tree position={[0, 0, 0]} />}
          {item.type === "mushroom" && <Mushroom position={[0, 0, 0]} />}
          {item.type === "bush"     && <Bush position={[0, 0, 0]} />}
        </group>
      ))}

      {/* Rider */}
      <group position={[0, 0, 2]}>
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.5, 0.9, 0.3]} />
          <meshStandardMaterial color="#1d4ed8" />
        </mesh>
        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.25, 10, 10]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0, 0.3, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.06, 8, 20]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0, 0.3, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.06, 8, 20]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0, 1.0, -0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          <meshStandardMaterial color="#555555" />
        </mesh>
      </group>

      {/* Gate */}
      <group ref={gateGroupRef} position={[0, 0, -30]}>
        <mesh position={[-4.5, 2, 0]}>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[4.5, 2, 0]}>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[9.4, 0.4, 0.4]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </>
  );
}

// ---------- Componente principal ----------
export default function TrackGame3D({ workJ, active, instantPower }: TrackGame3DProps) {
  const [celebrating, setCelebrating] = useState(false);
  const prevMilestone = useRef(0);

  useEffect(() => {
    if (!active || workJ == null) {
      prevMilestone.current = 0;
      return;
    }
    const current = Math.floor(workJ / MILESTONE_J);
    if (current > prevMilestone.current) {
      prevMilestone.current = current;
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 2000);
      return () => clearTimeout(t);
    }
  }, [workJ, active]);

  const safeWorkJ = active && workJ != null ? workJ : 0;
  const positionRatio = active ? (safeWorkJ % MILESTONE_J) / MILESTONE_J : 0;
  const safePower = active && instantPower != null ? instantPower : 0;
  const currentMilestone = Math.floor(safeWorkJ / MILESTONE_J);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-gray-400 text-sm uppercase tracking-widest text-center">Pista</h2>
      <div style={{ height: "400px" }} className="rounded-2xl overflow-hidden relative">
        <Canvas camera={{ position: [0, 3.5, 9], fov: 60, near: 0.1, far: 200 }}>
          <SceneContents
            positionRatio={positionRatio}
            instantPower={safePower}
            active={active}
            celebrating={celebrating}
            currentMilestone={currentMilestone}
          />
        </Canvas>
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-xl">
              Inicie o treino
            </span>
          </div>
        )}
        {active && currentMilestone > 0 && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <span className="text-white text-sm font-mono bg-black/50 px-3 py-1 rounded-lg">
              Trecho {currentMilestone + 1}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
