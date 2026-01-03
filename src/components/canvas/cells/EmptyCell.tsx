// src/components/canvas/cells/EmptyCell.tsx
import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../../store/gameStore';

interface EmptyCellProps {
  id: number;
  onClick: (e: ThreeEvent<PointerEvent>) => void;
}

// 1. SHARED GEOMETRY
const RING_GEO = new THREE.TorusGeometry(0.35, 0.015, 8, 32); 
const GHOST_GEO = new THREE.IcosahedronGeometry(0.25, 0);
const HITBOX_GEO = new THREE.PlaneGeometry(0.95, 0.95);

// COLORS
const COL_DEFAULT = new THREE.Color('#444444'); 
const COL_BLUE = new THREE.Color('#00f3ff');
const COL_GREEN = new THREE.Color('#00ff41');
const COL_PINK = new THREE.Color('#ff0055');

export const EmptyCell = ({ id, onClick }: EmptyCellProps) => {
  // --- SELECTORS ---
  const draggingGate = useGameStore(s => s.draggingGate);
  const selectedGate = useGameStore(s => s.selectedGate);
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const isMultiplayer = useGameStore(s => s.isMultiplayer);
  const myRole = useGameStore(s => s.myRole);
  const setHoveredCell = useGameStore(s => s.setHoveredCell);

  const isMyTurn = isMultiplayer 
    ? currentPlayer === myRole 
    : currentPlayer === 'blue';

  const [hovered, setHovered] = useState(false);
  
  const ringRef = useRef<THREE.Mesh>(null);
  const ghostRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ghostMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Helper for lerping (Persistent memory)
  const lerpColor = useRef(new THREE.Color('#444444'));

  useFrame((state, delta) => {
    if (!ringRef.current || !ghostRef.current || !ringMatRef.current || !ghostMatRef.current) return;
    
    // Cap delta for consistent animation speed even during lag
    const dt = Math.min(delta, 0.1);
    const t = state.clock.getElapsedTime();

    // --- 1. DETERMINE STATE ---
    let targetColor = COL_DEFAULT;
    let targetOpacity = 0.3; 
    let targetScale = 1.0;
    
    // Only show active hover effects if it's the player's turn
    if (hovered && isMyTurn) {
        targetOpacity = 1.0; 
        targetScale = 1.15;
        
        const type = draggingGate || selectedGate;
        if (type === 'Z') targetColor = COL_BLUE;
        else if (type === 'X') targetColor = COL_GREEN;
        else if (type === 'H') targetColor = COL_PINK;
    }

    // --- 2. UPDATE VISUALS ---
    
    // Color Lerp
    lerpColor.current.lerp(targetColor, dt * 15);
    ringMatRef.current.color.copy(lerpColor.current);
    ghostMatRef.current.color.copy(lerpColor.current);

    // Ring Animation
    ringMatRef.current.opacity = THREE.MathUtils.lerp(ringMatRef.current.opacity, targetOpacity, dt * 10);
    
    const currentScale = ringRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, dt * 15);
    ringRef.current.scale.setScalar(newScale);

    // Ghost Animation (Preview of the piece you are about to place)
    if (hovered && isMyTurn) {
        ghostRef.current.visible = true;
        ghostRef.current.rotation.y += dt * 2;
        
        ghostMatRef.current.opacity = THREE.MathUtils.lerp(ghostMatRef.current.opacity, 0.6, dt * 10);
        
        // Scale up only if not already full size
        if (ghostRef.current.scale.x < 0.99) {
            ghostRef.current.scale.lerp(new THREE.Vector3(1,1,1), dt * 10);
        }
        
        // Bobbing effect
        ghostRef.current.position.y = 0.45 + Math.sin(t * 5) * 0.05;
    } else {
        // Fade Out logic
        if (ghostMatRef.current.opacity > 0.01) {
            ghostMatRef.current.opacity = THREE.MathUtils.lerp(ghostMatRef.current.opacity, 0, dt * 20);
            ghostRef.current.scale.lerp(new THREE.Vector3(0,0,0), dt * 20);
        } else {
            ghostRef.current.visible = false;
        }
    }
  });

  return (
    <group position={[0, -0.4, 0]}> 
      
      {/* 1. HITBOX */}
      <mesh 
        geometry={HITBOX_GEO} 
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerUp={(e) => {
            e.stopPropagation();
            onClick(e);
        }}
        onPointerOver={(e) => {
            e.stopPropagation(); 
            if (isMyTurn) {
                setHovered(true);
                setHoveredCell(id);
            }
        }}
        onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            setHoveredCell(null);
        }}
      >
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* 2. THE RING MARKER */}
      <mesh 
        ref={ringRef} 
        geometry={RING_GEO} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
            ref={ringMatRef} 
            transparent 
            opacity={0.3} 
        />
      </mesh>

      {/* 3. GHOST PREVIEW */}
      <mesh ref={ghostRef} geometry={GHOST_GEO} visible={false}>
          <meshBasicMaterial 
            ref={ghostMatRef} 
            wireframe 
            transparent 
            opacity={0} 
            toneMapped={false} 
          />
      </mesh>

    </group>
  );
};