// src/components/canvas/ui/HoloGateCard.tsx
import { useState, useMemo, useRef } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- 3D PREVIEWS (Identical to DOM version, but native Three.js) ---
const InjectorPreview = () => {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.5, 0), []);
  const ring = useMemo(() => new THREE.TorusGeometry(0.8, 0.04, 4, 16), []);
  useFrame((state) => { if(ref.current) ref.current.rotation.y = state.clock.elapsedTime; });
  return (
    <group ref={ref}>
      <mesh geometry={geo}><meshBasicMaterial color="#00ff41" wireframe transparent opacity={0.3} /></mesh>
      <mesh geometry={geo} scale={0.7}><meshBasicMaterial color="#00ff41" toneMapped={false} /></mesh>
      <mesh geometry={ring} rotation={[1.5,0,0]}><meshBasicMaterial color="white" transparent opacity={0.5} /></mesh>
    </group>
  );
};

const FirewallPreview = () => {
  const ref = useRef<THREE.Group>(null);
  const shield = useMemo(() => new THREE.DodecahedronGeometry(0.7, 0), []);
  const core = useMemo(() => new THREE.IcosahedronGeometry(0.3, 0), []);
  useFrame((state) => { if(ref.current) ref.current.rotation.y = -state.clock.elapsedTime * 0.5; });
  return (
    <group ref={ref}>
      <mesh geometry={shield}><meshBasicMaterial color="#00f3ff" wireframe transparent opacity={0.2} /></mesh>
      <mesh geometry={core}><meshBasicMaterial color="#00f3ff" toneMapped={false} /></mesh>
    </group>
  );
};

const VirusPreview = () => {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.6, 0), []);
  useFrame((state) => { 
      if(ref.current && state.clock.getElapsedTime() % 0.2 < 0.05) {
          ref.current.rotation.set(Math.random()*3, Math.random()*3, 0);
      }
  });
  return (
    <group ref={ref}>
      <mesh geometry={geo}><meshBasicMaterial color="#ff0055" wireframe transparent opacity={0.4} /></mesh>
      <mesh geometry={geo} scale={0.5}><meshBasicMaterial color="#aa00ff" toneMapped={false} /></mesh>
    </group>
  );
};

// --- MAIN COMPONENT ---
interface HoloCardProps {
  type: string;
  name: string; // Updated from 'label' to match HUD
  x: number;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const HoloGateCard = ({ type, name, x, selected, disabled, onClick }: HoloCardProps) => {
  const [hovered, setHover] = useState(false);
  
  // Theme Config
  const config = useMemo(() => {
    if (type === 'Z') return { color: "#00f3ff" };
    if (type === 'X') return { color: "#00ff41" };
    return { color: "#ff0055" };
  }, [type]);

  const isActive = selected;
  const scale = isActive ? 1.1 : hovered ? 1.05 : 1.0;
  const borderColor = isActive ? config.color : hovered ? "#ffffff" : "#444444";

  return (
    <group 
      position={[x, 0, 0]} 
      scale={[scale, scale, scale]}
      onClick={(e) => { 
        if(disabled) return;
        e.stopPropagation(); 
        onClick(); 
      }} 
      onPointerOver={() => !disabled && setHover(true)} 
      onPointerOut={() => setHover(false)}
    >
      
      {/* 1. GLASS SLAB (Physical Body) */}
      <RoundedBox args={[1.6, 2.2, 0.1]} radius={0.1}>
        <meshPhysicalMaterial 
            color="#000000" 
            roughness={0.1} 
            metalness={0.9} 
            transmission={0.6} 
            transparent 
            opacity={0.5}
        />
      </RoundedBox>

      {/* 2. BORDER GLOW */}
      <mesh position={[0, 0, -0.01]}>
        <RoundedBox args={[1.65, 2.25, 0.08]} radius={0.1}>
           <meshBasicMaterial color={borderColor} transparent opacity={isActive ? 0.8 : 0.3} />
        </RoundedBox>
      </mesh>

      {/* 3. 3D CONTENT (Floating inside) */}
      <group position={[0, 0, 0]}>
         {type === 'Z' && <FirewallPreview />}
         {type === 'X' && <InjectorPreview />}
         {type === 'H' && <VirusPreview />}
      </group>

      {/* 4. TEXT OVERLAYS */}
      <group position={[0, 0, 0.06]}>
        {/* Top Type */}
        <Text 
            position={[-0.6, 0.9, 0]} 
            fontSize={0.2} 
            color={config.color} 
            anchorX="left" 
            fontWeight="bold"
        >
            {type}
        </Text>

        {/* Bottom Badge Name */}
        <group position={[0, -0.8, 0]}>
            <RoundedBox args={[1.2, 0.25, 0.02]} radius={0.1}>
                <meshBasicMaterial color="#111" transparent opacity={0.8} />
            </RoundedBox>
            <Text 
                position={[0, 0, 0.02]} 
                fontSize={0.12} 
                color="white" 
                fontWeight="bold"
                letterSpacing={0.1}
            >
                {name}
            </Text>
        </group>
      </group>

      {/* 5. ACTIVE LIGHT (Top Indicator) */}
      {isActive && (
        <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.05]} />
            <meshBasicMaterial color={config.color} toneMapped={false} />
        </mesh>
      )}

    </group>
  );
};