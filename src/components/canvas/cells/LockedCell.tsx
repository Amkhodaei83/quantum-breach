// src/components/canvas/cells/LockedCell.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LockedCellProps {
  owner: 'blue' | 'red';
}

const CORE_GEO = new THREE.IcosahedronGeometry(0.25, 0); 
const RING_GEO = new THREE.TorusGeometry(0.35, 0.02, 8, 32); 
const SHIELD_GEO = new THREE.DodecahedronGeometry(0.6, 0);
// Replacement for Points: Simple small box/sphere
const NODE_GEO = new THREE.BoxGeometry(0.08, 0.08, 0.08);

export const LockedCell = ({ owner }: LockedCellProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const shieldRef = useRef<THREE.Group>(null);
  const ringXRef = useRef<THREE.Mesh>(null);
  const ringYRef = useRef<THREE.Mesh>(null);
  const ringZRef = useRef<THREE.Mesh>(null);

  const color = owner === 'blue' ? '#00f3ff' : '#ff0055';

  useFrame((state, delta) => {
    if (!shieldRef.current || !ringXRef.current || !ringYRef.current || !ringZRef.current) return;

    shieldRef.current.rotation.y -= delta * 0.2;
    shieldRef.current.rotation.z += delta * 0.1;

    ringXRef.current.rotation.x += delta * 0.8;
    ringYRef.current.rotation.y += delta * 0.6;
    ringZRef.current.rotation.z += delta * 0.4;

    if (groupRef.current) {
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      
      {/* CORE */}
      <mesh geometry={CORE_GEO} scale={0.8}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* GYROSCOPE */}
      <mesh ref={ringXRef} geometry={RING_GEO} scale={0.7}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ringYRef} geometry={RING_GEO} scale={0.9}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ringZRef} geometry={RING_GEO} scale={1.1}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* SHIELD */}
      <group ref={shieldRef}>
        {/* Transparent Shell */}
        <mesh geometry={SHIELD_GEO} scale={0.95}>
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.3} 
                depthWrite={false} 
                side={THREE.DoubleSide}
                toneMapped={false}
            />
        </mesh>
        
        {/* Wireframe */}
        <mesh geometry={SHIELD_GEO} scale={1.0}>
            <meshBasicMaterial color="white" wireframe transparent opacity={0.5} toneMapped={false} />
        </mesh>
        
        {/* Corner Nodes (Replaced Points with simple meshes for stability) */}
        {/* We place 8 corners roughly */}
        {[
          [1,1,1], [1,1,-1], [1,-1,1], [1,-1,-1],
          [-1,1,1], [-1,1,-1], [-1,-1,1], [-1,-1,-1]
        ].map((pos, i) => (
             <mesh key={i} geometry={NODE_GEO} position={pos.map(p => p * 0.5) as [number,number,number]}>
                 <meshBasicMaterial color="white" toneMapped={false} />
             </mesh>
        ))}
      </group>
    </group>
  );
};