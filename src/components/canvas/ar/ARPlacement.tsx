// src/components/canvas/ar/ARPlacement.tsx
import { useRef, useMemo } from 'react';
import { useXRHitTest } from '@react-three/xr'; 
import { Ring, Circle } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../../store/gameStore';

interface ARPlacementProps {
  children: React.ReactNode;
}

export const ARPlacement = ({ children }: ARPlacementProps) => {
  const reticleRef = useRef<THREE.Group>(null);
  const contentRef = useRef<THREE.Group>(null);
  
  const isARPlaced = useGameStore(state => state.isARPlaced);
  const setARPlaced = useGameStore(state => state.setARPlaced);
  const arScale = useGameStore(state => state.arScale); 

  const hitMatrix = useMemo(() => new THREE.Matrix4(), []);

  useXRHitTest((results, getWorldMatrix) => {
    // If already placed, stop updating position to save resources
    if (isARPlaced) return;

    if (results.length > 0) {
      const success = getWorldMatrix(hitMatrix, results[0]);

      if (success) {
        // 1. Update Reticle Position
        if (reticleRef.current) {
            reticleRef.current.visible = true;
            hitMatrix.decompose(
              reticleRef.current.position,
              reticleRef.current.quaternion,
              reticleRef.current.scale
            );
        }

        // 2. Update Ghost Board Position (So you see what you're placing)
        if (contentRef.current) {
            contentRef.current.visible = true; // Make sure it's visible during placement
            contentRef.current.position.copy(reticleRef.current!.position);
            contentRef.current.quaternion.copy(reticleRef.current!.quaternion);
        }
      }
    } else {
        if (reticleRef.current) reticleRef.current.visible = false;
        // Optionally hide content if tracking is lost, to prevent floating weirdness
        if (contentRef.current && !isARPlaced) contentRef.current.visible = false;
    }
  }, 'viewer'); 

  const handleTap = (e: any) => {
    if (isARPlaced) return;
    e.stopPropagation();
    
    // Lock the board
    setARPlaced(true);
    
    // Hide reticle
    if (reticleRef.current) reticleRef.current.visible = false;
  };

  return (
    <>
      {/* 1. RETICLE (Green Ring) */}
      <group ref={reticleRef} visible={false}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <Ring args={[0.08, 0.1, 32]}>
                    <meshBasicMaterial color="#00ff41" transparent opacity={0.8} depthTest={false} />
                </Ring>
                <Circle args={[0.02, 32]}>
                    <meshBasicMaterial color="#00ff41" depthTest={false} />
                </Circle>
            </group>
      </group>

      {/* 2. TAP LISTENER (Floor Plane) */}
      {!isARPlaced && (
         <mesh rotation={[-Math.PI/2, 0, 0]} position={[0,0,0]} onClick={handleTap}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial transparent opacity={0} />
         </mesh>
      )}

      {/* 3. CONTENT (The Game Board) */}
      {/* Start invisible, hit test will make it visible */}
      <group ref={contentRef} visible={false} scale={[arScale, arScale, arScale]}>
         {children}
      </group>
    </>
  );
};