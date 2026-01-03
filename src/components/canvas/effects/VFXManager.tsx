// src/components/canvas/effects/VFXManager.tsx
import { useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../../store/gameStore';

export const VFXManager = () => {
  const { scene } = useThree();
  
  // STORE
  const currentPlayer = useGameStore(state => state.currentPlayer);
  const instability = useGameStore(state => state.instability);
  const winner = useGameStore(state => state.winner);
  const isARMode = useGameStore(state => state.isARMode);
  
  // 1. MANAGE ATMOSPHERE
  useEffect(() => {
    if (isARMode) {
      scene.fog = null;
      scene.background = null;
    } else {
      // Dark fog to blend the board edges into the void
      scene.fog = new THREE.FogExp2('#000000', 0.02);
    }
  }, [isARMode, scene]);

  return (
    <group>
      {/* 
          NOTE: ALL LIGHTS REMOVED. 
          Lighting is now handled exclusively by the QuantumBoard's internal reactor.
      */}

      {/* 2. AMBIENT PARTICLES */}
      <Sparkles 
        count={isARMode ? 30 : 60} 
        scale={12} 
        size={isARMode ? 4 : 2} 
        speed={0.2} 
        opacity={0.4} 
        color={currentPlayer === 'blue' ? "#00f3ff" : "#ff0055"} 
      />

      {/* 3. INSTABILITY EMBERS (High Stress) */}
      {instability > 50 && (
        <Sparkles 
          count={Math.floor(instability)} 
          scale={10} 
          size={4} 
          speed={1.5} 
          opacity={0.6}
          color={instability > 80 ? "#ff0000" : "#ffaa00"}
          noise={0.5}
        />
      )}

      {/* 4. VICTORY/DEFEAT CONFETTI */}
      {winner && (
        <Sparkles 
          count={300} 
          scale={15} 
          size={8} 
          speed={0.5} 
          opacity={1}
          color={winner === 'blue' ? "#00f3ff" : "#ff0055"}
          noise={1} 
        />
      )}
    </group>
  );
};