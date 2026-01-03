// src/components/dom/hud/GameHUD.tsx
import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GateCard } from './GateCard';

export const GameHUD = () => {
  const navigate = useNavigate();

  const { 
    scores, instability, winner, 
    draggingGate, hoveredCell, 
    setSelectedGate, setDraggingGate, executeMove, exitGame, isMultiplayer,
    isARMode 
  } = useGameStore();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // --- DRAG LOGIC ---
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (draggingGate) setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleUp = () => {
      if (draggingGate) {
        if (hoveredCell !== null) {
          executeMove(hoveredCell, draggingGate);
        }
        setDraggingGate(null);
      }
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingGate, hoveredCell, executeMove, setDraggingGate]);

  const handleDragStart = (e: React.PointerEvent, type: any) => {
    setSelectedGate(type);
    setDraggingGate(type);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleReboot = () => {
    exitGame();
    if (isMultiplayer) navigate('/lobby');
    else navigate('/setup');
  };

  if (isARMode) return null;

  // --- COMPONENT: GHOST CARD ---
  const GhostCard = () => {
    if (!draggingGate) return null;
    
    const colors = { 
        Z: 'border-cyan-500 text-cyan-400', 
        X: 'border-green-500 text-green-400', 
        H: 'border-pink-500 text-pink-500' 
    }[draggingGate];
    
    return (
      <div 
        className={`
            fixed z-[100] pointer-events-none 
            w-16 h-20 rounded-lg border-2 ${colors?.split(' ')[0]} 
            bg-black/80 backdrop-blur-md shadow-2xl
            flex items-center justify-center
        `}
        style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            transform: 'translate(-50%, -50%)' 
        }}
      >
        <span className={`text-2xl font-black ${colors?.split(' ')[1]}`}>
            {draggingGate}
        </span>
      </div>
    );
  };

  // --- COMPONENT: CINEMATIC END SCREEN ---
  const GameOverModal = () => {
    if (!winner) return null;

    // exact configuration requested
    const config = useMemo(() => {
        if (winner === 'blue') return {
            title: "VICTORY",
            text: "SYSTEM OVERRIDDEN. ACCESS GRANTED.",
            color: "text-cyan-400",
            border: "border-cyan-500",
            glow: "shadow-[inset_0_0_100px_rgba(34,211,238,0.2)]" // Blue Vignette
        };
        if (winner === 'red') return {
            title: "DEFEAT",
            text: "INTRUSION DETECTED. NEURAL LINK SEVERED.",
            color: "text-pink-500",
            border: "border-pink-500",
            glow: "shadow-[inset_0_0_100px_rgba(236,72,153,0.2)]" // Red Vignette
        };
        return { // Draw
            title: "CRITICAL FAILURE",
            text: "⚠ CORE MELTDOWN IMMINENT. EVACUATE IMMEDIATELY.",
            color: "text-yellow-400",
            border: "border-yellow-400",
            glow: "shadow-[inset_0_0_100px_rgba(250,204,21,0.2)] animate-pulse" // Yellow/Warning Vignette
        };
    }, [winner]);
    
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        // FIX: Added pointer-events-auto so the button works
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md ${config.glow} pointer-events-auto`}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} 
          animate={{ scale: 1, y: 0 }}
          className={`w-full max-w-lg bg-black/60 border-2 ${config.border} p-10 rounded-2xl shadow-2xl backdrop-blur-xl text-center`}
        >
          {/* Header */}
          <h1 className={`text-5xl md:text-6xl font-black mb-4 tracking-tighter drop-shadow-lg ${config.color}`}>
            {config.title}
          </h1>
          
          {/* Subtitle Message */}
          <div className={`text-xs md:text-sm font-bold font-mono mb-10 tracking-[0.15em] border-t border-b border-white/10 py-4 ${config.color}`}>
            {config.text}
          </div>
          
          {/* Scores Display */}
          <div className="flex justify-center gap-12 mb-10">
             <div className="text-center">
                <div className="text-[10px] font-bold text-cyan-400 mb-2 tracking-widest">HACKER</div>
                <div className="text-5xl font-black text-white">{scores.blue}</div>
             </div>
             <div className="w-px bg-white/10"></div>
             <div className="text-center">
                <div className="text-[10px] font-bold text-pink-500 mb-2 tracking-widest">SECURITY</div>
                <div className="text-5xl font-black text-white">{scores.red}</div>
             </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleReboot} 
            className={`
                w-full py-5 bg-white/5 hover:bg-white/10 border border-white/20 
                text-white font-black tracking-[0.3em] transition-all rounded-lg 
                shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            {isMultiplayer ? "RETURN TO LOBBY" : "REBOOT SYSTEM"}
          </button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <GhostCard />
      <GameOverModal />

      {/* --- HUD LAYOUT --- */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-40 overflow-hidden">
        
        {/* TOP BAR */}
        <div className="w-full max-w-3xl mx-auto mt-4 flex items-center gap-4">
            {/* BLUE */}
            <div className="bg-black/40 border border-cyan-500/30 backdrop-blur-md p-3 rounded-lg min-w-[80px] text-center shadow-lg">
                <div className="text-[9px] font-black text-cyan-400 tracking-widest mb-1">BLUE</div>
                <div className="text-2xl font-black text-white leading-none">{scores.blue}</div>
            </div>

            {/* ENTROPY */}
            <div className="flex-1 bg-black/40 border border-white/10 backdrop-blur-md p-3 rounded-lg flex flex-col justify-center shadow-lg">
                <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-2 tracking-widest px-1">
                    <span>SYSTEM INSTABILITY</span>
                    <span className={instability > 80 ? "text-red-500 animate-pulse" : "text-white"}>{Math.floor(instability)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden flex gap-0.5">
                    {[...Array(20)].map((_, i) => {
                        const threshold = (i + 1) * 5; 
                        const active = instability >= threshold;
                        const color = threshold > 80 ? 'bg-red-500' : threshold > 50 ? 'bg-purple-500' : 'bg-cyan-500';
                        return (
                            <div 
                                key={i} 
                                className={`flex-1 transition-all duration-300 ${active ? `${color} shadow-[0_0_5px_currentColor]` : 'bg-white/5'}`} 
                            />
                        );
                    })}
                </div>
            </div>

            {/* RED */}
            <div className="bg-black/40 border border-pink-500/30 backdrop-blur-md p-3 rounded-lg min-w-[80px] text-center shadow-lg">
                <div className="text-[9px] font-black text-pink-500 tracking-widest mb-1">RED</div>
                <div className="text-2xl font-black text-white leading-none">{scores.red}</div>
            </div>
        </div>
        
        {/* BOTTOM BAR */}
        <div className="w-full flex justify-center items-end pb-6 pointer-events-auto gap-4">
          <GateCard type="Z" onDragStart={(e) => handleDragStart(e, 'Z')} />
          <GateCard type="X" onDragStart={(e) => handleDragStart(e, 'X')} />
          <GateCard type="H" onDragStart={(e) => handleDragStart(e, 'H')} />
        </div>

      </div>
    </>
  );
};