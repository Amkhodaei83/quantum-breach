// src/components/canvas/ui/HolographicHUD.tsx
import { useMemo, useState } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import { useGameStore } from '../../../store/gameStore';
import { HoloGateCard } from './HoloGateCard';

// Reliable font URL
const FONT_URL = 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff';

const GameOverModal = ({ winner, scores, onExit }: any) => {
  const session = useXR((state) => state.session);
  const [hovered, setHover] = useState(false);

  const config = useMemo(() => {
    if (winner === 'blue') return { title: "VICTORY", text: "SYSTEM OVERRIDDEN.", color: "#00f3ff" };
    if (winner === 'red') return { title: "DEFEAT", text: "INTRUSION DETECTED.", color: "#ff0055" };
    return { title: "CRITICAL FAILURE", text: "CORE MELTDOWN.", color: "#facc15" };
  }, [winner]);

  const handleReboot = () => {
    if (session) session.end().catch((e) => console.warn(e));
    onExit();
  };

  return (
    <group position={[0, 2.5, 0]} rotation={[-Math.PI / 6, 0, 0]}>
      {/* Background Panel */}
      <RoundedBox args={[4, 2.5, 0.05]} radius={0.1} renderOrder={1}>
        <meshBasicMaterial color="black" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </RoundedBox>
      {/* Border Glow */}
      <mesh position={[0, 0, -0.01]} renderOrder={1}>
         <planeGeometry args={[4.1, 2.6]} />
         <meshBasicMaterial color={config.color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
      </mesh>

      <group position={[0, 0, 0.1]}>
        <Text font={FONT_URL} renderOrder={2} position={[0, 0.6, 0]} fontSize={0.5} fontWeight="black" anchorX="center" anchorY="middle">
          {config.title}
          <meshBasicMaterial attach="material" color={config.color} toneMapped={false} depthTest={false} />
        </Text>
        
        <Text font={FONT_URL} renderOrder={2} position={[0, 0.2, 0]} fontSize={0.15} letterSpacing={0.1} anchorX="center" anchorY="middle">
          {config.text}
          <meshBasicMaterial attach="material" color="white" toneMapped={false} depthTest={false} />
        </Text>
        
        <group position={[0, -0.3, 0]}>
           <Text font={FONT_URL} renderOrder={2} position={[-1, 0.2, 0]} fontSize={0.15}>
             HACKER
             <meshBasicMaterial attach="material" color="#00f3ff" toneMapped={false} depthTest={false} />
           </Text>
           <Text font={FONT_URL} renderOrder={2} position={[-1, -0.2, 0]} fontSize={0.4} fontWeight="bold">
             {scores.blue}
             <meshBasicMaterial attach="material" color="white" toneMapped={false} depthTest={false} />
           </Text>
           
           <Text font={FONT_URL} renderOrder={2} position={[1, 0.2, 0]} fontSize={0.15}>
             SECURITY
             <meshBasicMaterial attach="material" color="#ff0055" toneMapped={false} depthTest={false} />
           </Text>
           <Text font={FONT_URL} renderOrder={2} position={[1, -0.2, 0]} fontSize={0.4} fontWeight="bold">
             {scores.red}
             <meshBasicMaterial attach="material" color="white" toneMapped={false} depthTest={false} />
           </Text>
        </group>

        <group 
            position={[0, -0.9, 0.1]} 
            onClick={(e) => { e.stopPropagation(); handleReboot(); }}
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            scale={hovered ? 1.05 : 1.0}
        >
            <RoundedBox args={[2.5, 0.5, 0.1]} radius={0.1} renderOrder={2}>
                <meshBasicMaterial color={hovered ? "white" : "#222"} toneMapped={false} depthTest={false} />
            </RoundedBox>
            <Text font={FONT_URL} renderOrder={3} position={[0, 0, 0.06]} fontSize={0.2} fontWeight="bold">
                REBOOT SYSTEM
                <meshBasicMaterial attach="material" color={hovered ? "black" : "white"} toneMapped={false} depthTest={false} />
            </Text>
        </group>
      </group>
    </group>
  );
};

export const HolographicHUD = () => {
  const { 
    scores, instability, selectedGate, setSelectedGate, 
    currentPlayer, winner, setARPlaced, exitGame, 
    isMultiplayer, myRole 
  } = useGameStore();

  const canInteract = isMultiplayer ? currentPlayer === myRole : currentPlayer === 'blue';
  const [hoveredRelocate, setHoveredRelocate] = useState(false);

  if (winner) {
    return <GameOverModal winner={winner} scores={scores} onExit={exitGame} />;
  }

  return (
    <group>
      
      {/* 1. TOP HUD CONTAINER */}
      <group position={[0, 3, -2]} scale={[1.9, 1.9, 1.9]} rotation={[-Math.PI / 7, 0, 0]}>
        
        {/* === BLUE SCORE PANEL === */}
        <group position={[-2.5, 0, 0]}>
            {/* Background */}
            <RoundedBox args={[1.2, 1.0, 0.05]} radius={0.05} renderOrder={1}>
                <meshBasicMaterial color="black" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
            </RoundedBox>
            {/* Border */}
            <mesh position={[0, 0, -0.01]} renderOrder={1}>
                <planeGeometry args={[1.25, 1.05]} />
                <meshBasicMaterial color="#00f3ff" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
            </mesh>
            {/* Text Content */}
            <group position={[0, 0, 0.06]}>
                <Text font={FONT_URL} renderOrder={2} position={[0, 0.3, 0]} fontSize={0.12} fontWeight="bold">
                    Hacker
                    <meshBasicMaterial attach="material" color="#00f3ff" toneMapped={false} depthTest={false} />
                </Text>
                <Text font={FONT_URL} renderOrder={2} position={[0, -0.1, 0]} fontSize={0.5} fontWeight="bold">
                    {scores.blue}
                    <meshBasicMaterial attach="material" color="white" toneMapped={false} depthTest={false} />
                </Text>
            </group>
        </group>

        {/* === INSTABILITY BAR === */}
        <group position={[0, 0.1, 0]}>
            <Text font={FONT_URL} renderOrder={2} position={[-1.5, 0.3, 0]} fontSize={0.1} anchorX="left">
                INSTABILITY
                <meshBasicMaterial attach="material" color="gray" toneMapped={false} depthTest={false} />
            </Text>
            <Text font={FONT_URL} renderOrder={2} position={[1.5, 0.3, 0]} fontSize={0.1} anchorX="right">
                {Math.floor(instability)}%
                <meshBasicMaterial attach="material" color={instability > 80 ? "#ff0055" : "white"} toneMapped={false} depthTest={false} />
            </Text>
            
            <RoundedBox position={[0, 0, 0]} args={[3.0, 0.2, 0.05]} radius={0.05} renderOrder={1}>
                <meshBasicMaterial color="#111" toneMapped={false} />
            </RoundedBox>
            
            <group position={[-1.45, 0, 0.04]}>
                {[...Array(20)].map((_, i) => {
                    const threshold = (i + 1) * 5;
                    const active = instability >= threshold;
                    const color = threshold > 80 ? '#ff0055' : threshold > 50 ? '#aa00ff' : '#00f3ff';
                    if (!active) return null;
                    return (
                        <mesh key={i} position={[(i * 0.15) + 0.07, 0, 0]} renderOrder={2}>
                            <boxGeometry args={[0.12, 0.12, 0.02]} />
                            <meshBasicMaterial color={color} toneMapped={false} depthTest={false} />
                        </mesh>
                    );
                })}
            </group>
        </group>

        {/* === RED SCORE PANEL === */}
        <group position={[2.5, 0, 0]}>
            {/* Background */}
            <RoundedBox args={[1.2, 1.0, 0.05]} radius={0.05} renderOrder={1}>
                <meshBasicMaterial color="black" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
            </RoundedBox>
            {/* Border */}
            <mesh position={[0, 0, -0.01]} renderOrder={1}>
                <planeGeometry args={[1.25, 1.05]} />
                <meshBasicMaterial color="#ff0055" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
            </mesh>
            {/* Text Content */}
            <group position={[0, 0, 0.06]}>
                <Text font={FONT_URL} renderOrder={2} position={[0, 0.3, 0]} fontSize={0.12} fontWeight="bold">
                    AI
                    <meshBasicMaterial attach="material" color="#ff0055" toneMapped={false} depthTest={false} />
                </Text>
                <Text font={FONT_URL} renderOrder={2} position={[0, -0.1, 0]} fontSize={0.5} fontWeight="bold">
                    {scores.red}
                    <meshBasicMaterial attach="material" color="white" toneMapped={false} depthTest={false} />
                </Text>
            </group>
        </group>

        {/* === RELOCATE BUTTON === */}
        <group 
          position={[0, -0.7, 0]} 
          onClick={(e) => { e.stopPropagation(); setARPlaced(false); }}
          onPointerOver={() => setHoveredRelocate(true)}
          onPointerOut={() => setHoveredRelocate(false)}
          scale={hoveredRelocate ? 1.05 : 1.0}
        >
          <RoundedBox args={[1.8, 0.35, 0.05]} radius={0.05} renderOrder={1}>
             <meshBasicMaterial color="black" transparent opacity={0.7} depthWrite={false} toneMapped={false} />
          </RoundedBox>
          <mesh position={[0, 0, -0.01]} renderOrder={1}>
             <planeGeometry args={[1.85, 0.4]} />
             <meshBasicMaterial color={hoveredRelocate ? "white" : "#333"} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
          </mesh>
          
          <group position={[0, 0, 0.06]}>
             <Text font={FONT_URL} renderOrder={2} fontSize={0.12} fontWeight="bold">
                ✥ RELOCATE BOARD
                <meshBasicMaterial attach="material" color={hoveredRelocate ? "white" : "gray"} toneMapped={false} depthTest={false} />
             </Text>
          </group>
        </group>
      </group>

      {/* 2. BOTTOM HUD (Cards) */}
      <group position={[0, -1.5, 9.8]} rotation={[-Math.PI / 3, 0, 0]}>
        <HoloGateCard 
            type="Z" name="FIREWALL" x={-2} 
            selected={selectedGate === 'Z'} 
            disabled={!canInteract} 
            onClick={() => canInteract && setSelectedGate('Z')} 
        />
        <HoloGateCard 
            type="X" name="INJECTOR" x={0} 
            selected={selectedGate === 'X'} 
            disabled={!canInteract} 
            onClick={() => canInteract && setSelectedGate('X')} 
        />
        <HoloGateCard 
            type="H" name="VIRUS" x={2} 
            selected={selectedGate === 'H'} 
            disabled={!canInteract} 
            onClick={() => canInteract && setSelectedGate('H')} 
        />
      </group>

    </group>
  );
};