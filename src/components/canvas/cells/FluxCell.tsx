// src/components/canvas/cells/FluxCell.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- SHARED GEOMETRIES (Optimization #18) ---
const CORE_GEO = new THREE.IcosahedronGeometry(0.25, 0); 
const RING_GEO = new THREE.TorusGeometry(0.4, 0.02, 8, 32);
const FLUX_GEO = new THREE.IcosahedronGeometry(0.45, 0); 

// --- COLORS ---
const COL_BLUE = new THREE.Color('#00f3ff');
const COL_RED = new THREE.Color('#ff0055');
const COL_FLUX = new THREE.Color('#aa00ff'); 

export const FluxCell = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const shellRef = useRef<THREE.Mesh>(null);
  
  // Persistent color object to avoid GC
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (!coreRef.current || !shellRef.current) return;
    
    const t = state.clock.getElapsedTime();

    // ==========================================
    // 1. INNER CORE (Rotating & Pulsing)
    // ==========================================
    
    coreRef.current.rotation.x += delta * 1.5;
    coreRef.current.rotation.y += delta * 2.0;

    // Color Shifting (Blue <-> Red)
    // Optimization: Calculate sin once
    const blendFactor = (Math.sin(t * 2) + 1) / 2; 
    tempColor.lerpColors(COL_BLUE, COL_RED, blendFactor);

    // Update Colors
    // Casting to access .color is faster than ref updating in React
    (coreRef.current.material as THREE.MeshBasicMaterial).color.copy(tempColor);
    if(ring1Ref.current) (ring1Ref.current.material as THREE.MeshBasicMaterial).color.copy(tempColor);
    if(ring2Ref.current) (ring2Ref.current.material as THREE.MeshBasicMaterial).color.copy(tempColor);
    if(ring3Ref.current) (ring3Ref.current.material as THREE.MeshBasicMaterial).color.copy(tempColor);

    // ==========================================
    // 2. OUTER SHELL (Static Glitch)
    // ==========================================
    
    // Optimization: Modulo check is fast
    if (t % 0.12 < 0.02) {
        // Random glitch effect
        const rotX = Math.floor(Math.random() * 4) * (Math.PI / 2);
        const rotY = Math.floor(Math.random() * 4) * (Math.PI / 2);
        
        shellRef.current.rotation.set(rotX, rotY, 0);

        const scale = 1 + (Math.random() * 0.3);
        shellRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
        {/* --- INNER PARTS --- */}
        
        {/* Core: Rotating */}
        <mesh ref={coreRef} geometry={CORE_GEO}>
            <meshBasicMaterial toneMapped={false} />
        </mesh>

        {/* Rings: STATIC (Fixed rotation to look like a gyroscope) */}
        <mesh ref={ring1Ref} geometry={RING_GEO} scale={0.6} rotation={[Math.PI/2, 0, 0]}>
            <meshBasicMaterial toneMapped={false} transparent opacity={0.8} />
        </mesh>
        
        <mesh ref={ring2Ref} geometry={RING_GEO} scale={0.8} rotation={[0, Math.PI/2, 0]}>
            <meshBasicMaterial toneMapped={false} transparent opacity={0.6} />
        </mesh>
        
        <mesh ref={ring3Ref} geometry={RING_GEO} scale={1.0} rotation={[0, 0, Math.PI/4]}>
            <meshBasicMaterial toneMapped={false} transparent opacity={0.4} />
        </mesh>

        {/* --- OUTER SHELL --- */}
        <mesh ref={shellRef} geometry={FLUX_GEO}>
            <meshBasicMaterial 
                color={COL_FLUX}
                wireframe 
                toneMapped={false} 
                transparent 
                opacity={0.4} 
            />
        </mesh>
    </group>
  );
};