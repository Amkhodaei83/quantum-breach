// src/pages/OfflineSetup.tsx
import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { clsx } from 'clsx';

const OfflineSetup = () => {
  const navigate = useNavigate();
  const startGame = useGameStore(state => state.startGame);
  const setARMode = useGameStore(state => state.setARMode);

  // UI STATE
  // We use a float for smooth sliding, but round it for Game Logic
  const [rawDifficulty, setRawDifficulty] = useState(3.0); 
  const [isAR, setIsAR] = useState(false);

  // Derived integer for display and logic
  const displayLevel = Math.round(rawDifficulty);

  // THEME LOGIC (Smooth Transitions)
  const theme = useMemo(() => {
    if (rawDifficulty < 3) return { color: 'text-neon-green', border: 'border-neon-green', bg: 'bg-neon-green', label: 'TRAINING', glow: 'shadow-neon-green/50' };
    if (rawDifficulty < 6) return { color: 'text-neon-blue', border: 'border-neon-blue', bg: 'bg-neon-blue', label: 'STANDARD', glow: 'shadow-neon-blue/50' };
    if (rawDifficulty < 9) return { color: 'text-neon-pink', border: 'border-neon-pink', bg: 'bg-neon-pink', label: 'ADVANCED', glow: 'shadow-neon-pink/50' };
    // GOLD TIER (9.0 - 10.0)
    return { color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400', label: 'NIGHTMARE', glow: 'shadow-yellow-400/50' };
  }, [rawDifficulty]);

  const handleLaunch = () => {
    setARMode(isAR);
    startGame(displayLevel); 
    navigate('/game');
  };

  return (
    <div className="relative w-full h-[100dvh] text-white font-mono flex flex-col items-center overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="z-20 w-full p-4 md:p-6 flex justify-between items-center border-b border-white/10 bg-black/20 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            MISSION_SETUP
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full animate-pulse ${theme.bg}`}></span>
            <p className={`text-[10px] md:text-xs tracking-[0.2em] ${theme.color} transition-colors duration-300`}>
              {theme.label} PROTOCOL
            </p>
          </div>
        </div>

        <Link to="/">
          <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white border border-transparent hover:border-gray-600 rounded transition-all bg-black/40">
            &lt; ABORT
          </button>
        </Link>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="z-10 w-full max-w-md flex-1 flex flex-col justify-center p-6 gap-6 overflow-y-auto custom-scrollbar touch-pan-y">
        
        {/* --- THE COMMAND BOX --- */}
        <div className="relative group">
            {/* Brackets */}
            <div className={`absolute -left-2 -top-2 w-4 h-4 border-l-2 border-t-2 ${theme.border} transition-colors duration-500`}></div>
            <div className={`absolute -right-2 -bottom-2 w-4 h-4 border-r-2 border-b-2 ${theme.border} transition-colors duration-500`}></div>

            <div className="bg-black/40 border border-white/10 backdrop-blur-md p-6 rounded-lg flex flex-col gap-8 shadow-lg">
                
                {/* A. SMOOTH DIFFICULTY SLIDER */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <label className={`text-[10px] font-bold tracking-widest ${theme.color} transition-colors duration-300`}>
                            AI NEURAL DEPTH
                        </label>
                        <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded border border-white/10 min-w-[3rem] text-center">
                            LVL {displayLevel}
                        </span>
                    </div>
                    
                    <div className="relative h-8 flex items-center">
                        {/* Track Background */}
                        <div className="absolute w-full h-1 bg-gray-800 rounded-full overflow-hidden"></div>
                        
                        {/* Active Track (Colored) */}
                        <div 
                            className={`absolute h-1 rounded-full ${theme.bg} transition-colors duration-300 shadow-[0_0_10px_currentColor]`} 
                            style={{ width: `${((rawDifficulty - 1) / 9) * 100}%` }}
                        ></div>

                        {/* Circular Thumb */}
                        <div 
                            className={`
                                absolute h-6 w-6 rounded-full bg-black border-2 ${theme.border} 
                                shadow-lg z-10 pointer-events-none transition-colors duration-300
                                flex items-center justify-center
                            `}
                            style={{ 
                                left: `calc(${((rawDifficulty - 1) / 9) * 100}%)`,
                                transform: 'translateX(-50%)' // Center the circle on the value
                            }}
                        >
                            {/* Inner Dot */}
                            <div className={`w-2 h-2 rounded-full ${theme.bg}`}></div>
                        </div>

                        {/* Invisible Input (Captures Touch/Drag) */}
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            step="0.1" // Smooth steps
                            value={rawDifficulty} 
                            onChange={(e) => setRawDifficulty(parseFloat(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </div>
                    
                    <div className="flex justify-between text-[9px] text-gray-600 font-bold mt-1">
                        <span>NOVICE</span>
                        <span>STANDARD</span>
                        <span className={rawDifficulty >= 9 ? "text-yellow-500 animate-pulse" : ""}>GODLIKE</span>
                    </div>
                </div>

                {/* B. AR TOGGLE */}
                <div 
                    onClick={() => setIsAR(!isAR)}
                    className={clsx(
                        "cursor-pointer p-4 rounded border transition-all duration-300 flex items-center justify-between group/ar",
                        isAR ? `bg-white/5 ${theme.border}` : "bg-black/30 border-gray-700 hover:border-gray-500"
                    )}
                >
                    <div className="flex flex-col gap-1">
                        <span className={clsx("text-[10px] font-black tracking-widest transition-colors", isAR ? theme.color : "text-gray-400")}>
                            AR_PASSTHROUGH
                        </span>
                        <span className="text-[9px] text-gray-500">
                            {isAR ? "CAMERA FEED ACTIVE" : "STANDARD 3D VIEW"}
                        </span>
                    </div>
                    
                    {/* Switch UI */}
                    <div className={clsx("w-10 h-5 rounded-full relative transition-colors duration-300", isAR ? theme.bg : "bg-gray-800")}>
                        <div className={clsx("absolute top-1 w-3 h-3 bg-black rounded-full shadow-md transition-transform duration-300", isAR ? "left-6" : "left-1")}></div>
                    </div>
                </div>

                {/* C. LAUNCH BUTTON */}
                <button 
                    onClick={handleLaunch}
                    onMouseEnter={() => import('./GameSession')} 
                    className={`
                        w-full py-4 border font-black tracking-[0.2em] transition-all rounded shadow-lg active:scale-[0.98]
                        ${theme.border} ${theme.color} hover:text-black bg-black/20
                        hover:${theme.bg} hover:shadow-[0_0_20px_currentColor]
                    `}
                >
                    INITIALIZE SYSTEM
                </button>

            </div>
        </div>

        {/* --- FOOTER SPECS --- */}
        <div className="flex justify-between items-center px-4 opacity-50">
            <span className="text-[9px] text-gray-500 tracking-widest">GRID: 6x6 MATRIX</span>
            <span className="text-[9px] text-gray-500 tracking-widest">SEED: QUANTUM_RNG</span>
        </div>

      </div>

    </div>
  );
};

export default OfflineSetup;