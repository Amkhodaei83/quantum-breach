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
  
  // CONNECT TO STORE
  const isARPlaced = useGameStore(state => state.isARPlaced);
  const setARPlaced = useGameStore(state => state.setARPlaced);
  const arScale = useGameStore(state => state.arScale); // This is locked at 0.04

  const hitMatrix = useMemo(() => new THREE.Matrix4(), []);

  // 1. HIT TEST (Scanning for floor)
  useXRHitTest((results, getWorldMatrix) => {
    // If we are already placed (LOCKED), stop scanning to save resources
    if (isARPlaced) {
       if (reticleRef.current) reticleRef.current.visible = false;
       return;
    }

    if (results.length > 0) {
      const success = getWorldMatrix(hitMatrix, results[0]);

      if (success && reticleRef.current && contentRef.current) {
        reticleRef.current.visible = true;
        
        // Decompose matrix to get position/rotation
        hitMatrix.decompose(
          reticleRef.current.position,
          reticleRef.current.quaternion,
          reticleRef.current.scale
        );

        // Move the Game Board (Ghost Mode) to follow reticle
        contentRef.current.position.copy(reticleRef.current.position);
        contentRef.current.quaternion.copy(reticleRef.current.quaternion);
      }
    } else {
        // Hide reticle if no floor found
        if (reticleRef.current) reticleRef.current.visible = false;
    }
  }, 'viewer'); 

  // 2. TAP LISTENER
  const handleTap = (e: any) => {
    if (isARPlaced) return; // Already locked
    e.stopPropagation(); // Prevent clicking things behind it
    setARPlaced(true); // LOCK THE BOARD
  };

  return (
    <>
      {/* Visual Reticle (Green Ring) - Only shows when NOT placed */}
      {!isARPlaced && (
        <group ref={reticleRef} visible={false}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <Ring args={[0.15, 0.2, 32]}>
                    <meshBasicMaterial color="#00ff41" transparent opacity={0.8} />
                </Ring>
                <Circle args={[0.05, 32]}>
                    <meshBasicMaterial color="#00ff41" />
                </Circle>
            </group>
        </group>
      )}

      {/* Invisible Floor Plane - Catches the Tap */}
      {!isARPlaced && (
         <mesh rotation={[-Math.PI/2, 0, 0]} position={[0,0,0]} onClick={handleTap}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial transparent opacity={0} />
         </mesh>
      )}

      {/* The Actual Game Board */}
      <group ref={contentRef} visible={true} scale={[arScale, arScale, arScale]}>
         {children}
      </group>
    </>
  );
};