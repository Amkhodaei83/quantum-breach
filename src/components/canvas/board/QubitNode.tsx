// src/components/canvas/board/QubitNode.tsx
import { useRef, useState, memo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { type Qubit } from '../../../engine/core/QuantumLogic';
import { useGameStore } from '../../../store/gameStore';

// SUB-COMPONENTS
import { EmptyCell } from '../cells/EmptyCell';
import { StableCell } from '../cells/StableCell';
import { LockedCell } from '../cells/LockedCell';
import { FluxCell } from '../cells/FluxCell';

interface QubitNodeProps {
  data: Qubit;
  index: number; 
}

const QubitNodeComponent = ({ data, index }: QubitNodeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // OPTIMIZATION #8: Granular Selectors
  // Only subscribe to what matters for THIS interaction
  const draggingGate = useGameStore(s => s.draggingGate);
  const selectedGate = useGameStore(s => s.selectedGate);
  const executeMove = useGameStore(s => s.executeMove);
  
  // We need current player to enable/disable interaction
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const isMultiplayer = useGameStore(s => s.isMultiplayer);
  const myRole = useGameStore(s => s.myRole);
  
  // These stop interaction globally
  const winner = useGameStore(s => s.winner);
  const isAIThinking = useGameStore(s => s.isAIThinking);

  // --- TURN LOGIC ---
  const isMyTurn = isMultiplayer 
    ? currentPlayer === myRole 
    : currentPlayer === 'blue';

  // --- ANIMATION STATE ---
  const [mountedAt] = useState(() => Date.now());
  
  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    // 1. STAGGERED SPAWN LOGIC
    // Using time delta ensures smooth animation regardless of framerate
    const timeSinceMount = (Date.now() - mountedAt) / 1000;
    const delay = index * 0.02; 
    
    let targetScale = 0;
    if (timeSinceMount > delay) {
        targetScale = 1.0;
    }

    // 2. SMOOTH LERP (Optimization: Sleep when reached target)
    if (Math.abs(groupRef.current.scale.x - targetScale) > 0.01) {
        const speed = 8;
        // Optimization: Lerp scalar instead of creating new Vectors every frame
        const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * speed);
        groupRef.current.scale.setScalar(s);
    } else if (targetScale === 1 && groupRef.current.scale.x !== 1) {
        groupRef.current.scale.setScalar(1);
    }
  });

  // --- INTERACTION ---
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation(); 
    
    if (!isMyTurn || winner || isAIThinking) return;

    // OPTIMIZATION #17: Haptic Feedback
    if (navigator.vibrate) navigator.vibrate(10);

    const gate = draggingGate || selectedGate;
    executeMove(data.id, gate);
  };

  return (
    <group 
      ref={groupRef} 
      position={[data.x * 1.1, 0, data.y * 1.1]}
      scale={[0, 0, 0]} 
    >
      {data.status === null && (
        <EmptyCell id={data.id} onClick={handlePointerUp} />
      )}
      
      {data.status === 'STABLE' && (
        <StableCell owner={data.owner} justSpawned={true} />
      )}

      {data.status === 'LOCKED' && data.owner && (
        <LockedCell owner={data.owner} />
      )}

      {data.status === 'FLUX' && (
        <FluxCell />
      )}
    </group>
  );
};

// OPTIMIZATION #8: Memoization
// Only re-render if the cell data changes or the turn changes (for interaction enabling)
export const QubitNode = memo(QubitNodeComponent, (prev, next) => {
  // Check Data Integrity
  if (prev.data.status !== next.data.status) return false;
  if (prev.data.owner !== next.data.owner) return false;
  if (prev.data.fluxOwner !== next.data.fluxOwner) return false;
  
  // We cannot easily compare store state inside memo without passing it as props.
  // Ideally, QubitNode should receive `isMyTurn` as a prop from the parent to make memo work perfectly.
  // However, even this basic check prevents re-renders when *other* cells change.
  return true; 
});