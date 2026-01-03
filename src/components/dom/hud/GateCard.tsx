// src/components/dom/hud/GateCard.tsx
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clsx } from 'clsx';
import { useGameStore } from '../../../store/gameStore';
import type { GateType } from '../../../engine/core/QuantumLogic';

// ==========================================
// 3D PREVIEWS (Scaled down for depth)
// ==========================================

const InjectorPreview = () => {
  const group = useRef<THREE.Group>(null);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(1.0, 0), []); 
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.6, 0.08, 8, 32), []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.x = t * 0.5;
    group.current.rotation.y = t * 0.8;
  });

  return (
    <group ref={group} scale={0.55}>
      <mesh geometry={coreGeo}>
        <meshBasicMaterial color="#00ff41" toneMapped={false} />
      </mesh>
      <mesh geometry={coreGeo} scale={1.2}>
        <meshBasicMaterial color="white" wireframe transparent opacity={0.2} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[Math.PI/2, 0, 0]} scale={0.7}>
         <meshBasicMaterial color="#00ff41" transparent opacity={0.6} toneMapped={false} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[0, Math.PI/2, 0]} scale={0.9}>
         <meshBasicMaterial color="#00ff41" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh geometry={ringGeo} rotation={[Math.PI/4, Math.PI/4, 0]} scale={1.1}>
         <meshBasicMaterial color="#00ff41" transparent opacity={0.2} toneMapped={false} />
      </mesh>
    </group>
  );
};

const FirewallPreview = () => {
  const group = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.8, 0), []);
  const shieldGeo = useMemo(() => new THREE.DodecahedronGeometry(1.8, 0), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.2, 0.08, 8, 32), []);

  useFrame((state) => {
    if (!group.current || !shieldRef.current) return;
    const t = state.clock.getElapsedTime();
    shieldRef.current.rotation.y = -t * 0.2;
    shieldRef.current.rotation.z = t * 0.1;
  });

  return (
    <group ref={group} scale={0.55}>
      <mesh geometry={coreGeo}>
        <meshBasicMaterial color="#00f3ff" toneMapped={false} />
      </mesh>
      <mesh geometry={ringGeo} scale={0.6} rotation={[Math.PI/2, 0, 0]}>
         <meshBasicMaterial color="#00f3ff" toneMapped={false} />
      </mesh>
      <mesh geometry={ringGeo} scale={0.8} rotation={[0, Math.PI/2, 0]}>
         <meshBasicMaterial color="#00f3ff" toneMapped={false} />
      </mesh>
      <mesh ref={shieldRef} geometry={shieldGeo}>
        <meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

const VirusPreview = () => {
  const group = useRef<THREE.Group>(null);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.9, 0), []);
  const shellGeo = useMemo(() => new THREE.IcosahedronGeometry(1.6, 0), []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.children[0].rotation.x = t * 2;
    group.current.children[0].rotation.y = t;

    if (t % 0.15 < 0.02) {
       const shell = group.current.children[1];
       shell.rotation.set(Math.random()*3, Math.random()*3, 0);
       const s = 1 + Math.random() * 0.3;
       shell.scale.set(s,s,s);
    }
  });

  return (
    <group ref={group} scale={0.55}>
      <mesh geometry={coreGeo}>
        <meshBasicMaterial color="#ff0055" toneMapped={false} />
      </mesh>
      <mesh geometry={shellGeo}>
        <meshBasicMaterial color="#aa00ff" wireframe transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  );
};


// ==========================================
// 2. ULTRA-CLEAR GLASS UI
// ==========================================

interface GateCardProps {
  type: GateType;
  onDragStart: (e: React.PointerEvent) => void;
}

export const GateCard = ({ type, onDragStart }: GateCardProps) => {
  const { selectedGate, draggingGate, currentPlayer, isMultiplayer, myRole } = useGameStore();
  
  const isMyTurn = isMultiplayer ? currentPlayer === myRole : currentPlayer === 'blue';
  const isSelected = selectedGate === type;
  const isDraggingThis = draggingGate === type;

  const config = useMemo(() => {
    if (type === 'Z') return { name: "FIREWALL", color: 'text-cyan-400', border: 'border-cyan-500/50', glow: 'shadow-cyan-500/50' };
    if (type === 'X') return { name: "INJECTOR", color: 'text-green-400', border: 'border-green-500/50', glow: 'shadow-green-500/50' };
    return { name: "VIRUS", color: 'text-pink-500', border: 'border-pink-500/50', glow: 'shadow-pink-500/50' };
  }, [type]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); 
    if (!isMyTurn) return;
    const target = e.target as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
    onDragStart(e);
  };

  return (
    <div className="relative group">
      
      {/* Top Active Line */}
      <div className={clsx(
        "absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-[2px] transition-all duration-300",
        isSelected ? `bg-current ${config.color} shadow-[0_0_15px_currentColor]` : "bg-transparent"
      )} />

      <button
        onPointerDown={handlePointerDown}
        disabled={!isMyTurn}
        className={clsx(
          "relative w-28 h-40 rounded-xl overflow-hidden transition-all duration-300",
          
          // --- REAL GLASS EFFECT ---
          // 1. Almost zero background opacity (Only 5% at top gradient)
          "bg-gradient-to-b from-white/10 to-transparent",
          // 2. Medium Blur (Frosted look, not Solid look)
          "backdrop-blur-md",
          // 3. Thin, crisp borders
          "border", isSelected ? "border-white" : "border-white/20 hover:border-white/40",
          
          // --- INTERACTION STATES ---
          isDraggingThis ? "opacity-30 scale-90" : "opacity-100",
          isSelected ? `scale-105 -translate-y-2 shadow-2xl ${config.glow}` : "hover:-translate-y-1 hover:shadow-lg",
          !isMyTurn && "opacity-30 grayscale cursor-not-allowed border-dashed"
        )}
      >
        
        {/* SCANLINE (Faint) */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwMDAwIi8+CjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz4KPC9zdmc+')] opacity-10 pointer-events-none z-0" />

        {/* 3D CONTENT */}
        <div className="absolute inset-0 z-0">
            <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[5, 2, 5]} intensity={10} />
                {type === 'Z' && <FirewallPreview />}
                {type === 'X' && <InjectorPreview />}
                {type === 'H' && <VirusPreview />}
            </Canvas>
        </div>

        {/* ID (Watermark style) */}
        <div className="absolute top-2 left-3 z-10 pointer-events-none">
            <span className={clsx("text-4xl font-black opacity-20 select-none", config.color)}>{type}</span>
        </div>

        {/* NAME BADGE (Floating Glass Pill) */}
        <div className="absolute bottom-3 w-full flex justify-center z-10 pointer-events-none">
            <div className={clsx(
                "px-3 py-1 rounded-full backdrop-blur-md shadow-lg border border-white/10",
                "bg-black/30" // Slight tint for readability
            )}>
                <span className={clsx("text-[9px] font-black tracking-widest block", config.color)}>
                    {config.name}
                </span>
            </div>
        </div>

      </button>
    </div>
  );
};