// src/components/canvas/cells/StableCell.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StableCellProps {
  owner: 'blue' | 'red' | null;
  justSpawned?: boolean;
}

// SHARED GEOMETRY (Optimization)
const CORE_GEO = new THREE.IcosahedronGeometry(0.25, 0); 
const RING_GEO = new THREE.TorusGeometry(0.4, 0.02, 8, 32); 

export const StableCell = ({ owner }: StableCellProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const color = owner === 'blue' ? '#00f3ff' : '#ff0055';
  
  // RANDOMIZED SPEEDS (Computed once per cell)
  const speeds = useMemo(() => [
    (Math.random() * 0.5 + 1) * (Math.random() > 0.5 ? 1 : -1), 
    (Math.random() * 0.5 + 1) * (Math.random() > 0.5 ? 1 : -1), 
    (Math.random() * 0.5 + 1) * (Math.random() > 0.5 ? 1 : -1), 
    (Math.random() * 0.5 + 1) * (Math.random() > 0.5 ? 1 : -1), 
    (Math.random() * 0.2 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
  ], []);

  useFrame((state, delta) => {
    if (!coreRef.current || !ring1Ref.current || !ring2Ref.current || !ring3Ref.current) return;
    
    // Core Rotation
    coreRef.current.rotation.x += delta * 1.5;
    coreRef.current.rotation.y += delta * 2.0;

    // Ring Rotation
    ring1Ref.current.rotation.x += delta * speeds[0];
    ring1Ref.current.rotation.y += delta * speeds[1];

    ring2Ref.current.rotation.x += delta * speeds[2];
    ring2Ref.current.rotation.y += delta * speeds[3];

    ring3Ref.current.rotation.x += delta * speeds[4];
    
    // Hover Effect
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={coreRef}>
        <mesh geometry={CORE_GEO} scale={0.8}>
            <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh geometry={CORE_GEO} scale={1.1}>
            <meshBasicMaterial color="white" wireframe transparent opacity={0.5} />
        </mesh>
      </group>

      <mesh ref={ring1Ref} geometry={RING_GEO} scale={0.7}>
        <meshBasicMaterial color={color} toneMapped={false} opacity={1.0} transparent />
      </mesh>

      <mesh ref={ring2Ref} geometry={RING_GEO} scale={0.9}>
        <meshBasicMaterial color={color} toneMapped={false} opacity={0.8} transparent />
      </mesh>

      <mesh ref={ring3Ref} geometry={RING_GEO} scale={1.1}>
        <meshBasicMaterial color={color} toneMapped={false} opacity={0.6} transparent />
      </mesh>
    </group>
  );
};