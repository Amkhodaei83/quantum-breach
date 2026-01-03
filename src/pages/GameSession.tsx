// src/pages/GameSession.tsx
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import { useGameStore, useStatus, useInstability } from '../store/gameStore';
import { useMemo, useState, useRef, Suspense, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

// Engine
import { GeometryManager } from '../engine/core/GeometryManager';

// Components
import { QuantumBoard } from '../components/canvas/board/QuantumBoard';
import BackgroundScene from '../components/canvas/BackgroundScene';
import { GameHUD } from '../components/dom/hud/GameHUD';
import { VFXManager } from '../components/canvas/effects/VFXManager';
import { ARPlacement } from '../components/canvas/ar/ARPlacement'; 

const store = createXRStore({
  hitTest: true,
  foveation: 0,
});

const GameSession = () => {
  const navigate = useNavigate();
  
  const status = useStatus();
  const instability = useInstability();
  
  const isARMode = useGameStore(s => s.isARMode);
  const opponentDisconnected = useGameStore(s => s.opponentDisconnected);
  const exitGame = useGameStore(s => s.exitGame);
  const isLoading = useGameStore(s => s.isLoading);

  const [arStarted, setArStarted] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const uiRef = useRef<HTMLDivElement>(null);

  const backgroundSpeed = useMemo(() => {
    return 1 + (instability / 100) * 4;
  }, [instability]);

  // OPTIMIZATION: Resource Cleanup on Unmount
  useEffect(() => {
    return () => {
      // 1. Dispose Geometry Cache
      GeometryManager.dispose();

      // 2. Clean up XR session
      // @ts-ignore
      if (store.session) {
          // @ts-ignore
          store.session.end().catch((err) => console.warn("Session end warning:", err));
      }
    };
  }, []);

  // PREVENT REDIRECT IF LOADING
  if (status === 'idle' && !isLoading) {
    return <Navigate to="/" replace />;
  }

  const handleExit = () => {
    exitGame();
    navigate('/');
  };

  const handleStartAR = async () => {
    setArError(null);
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setArError("AR REQUIRES HTTPS.");
      return;
    }
    if (!('xr' in navigator)) {
      setArError("WEBXR NOT FOUND.");
      return;
    }

    if (uiRef.current) {
      try {
        const sessionOptions = {
          requiredFeatures: ['local-floor'],
          optionalFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: uiRef.current }
        };
        // @ts-ignore
        await store.enterAR(sessionOptions);
        setArStarted(true);
      } catch (e: any) {
        // Fallback
        try {
            // @ts-ignore
            await store.enterAR({ requiredFeatures: ['local-floor'], optionalFeatures: ['hit-test'] });
            setArStarted(true);
        } catch (retryError: any) {
            setArError(`AR FAILED: ${retryError.message}`);
        }
      }
    }
  };

  if (status === 'waiting_for_opponent') {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Waiting Room still needs its own background since Game Canvas isn't mounted yet */}
        <div className="absolute inset-0 z-0">
           <Canvas camera={{ position: [0, 0, 30], fov: 60 }} resize={{ scroll: false }}>
             <BackgroundScene speed={0.5} autoShift={true} />
           </Canvas>
        </div>
        
        <div className="z-10 p-8 border border-neon-blue/30 bg-gray-900/80 backdrop-blur-md rounded-2xl text-center shadow-[0_0_50px_rgba(0,243,255,0.1)]">
          <div className="w-16 h-16 border-4 border-t-neon-blue border-r-transparent border-b-neon-blue border-l-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-widest">ESTABLISHING UPLINK</h2>
          <div className="mt-8">
            <button onClick={handleExit} className="text-xs text-gray-500 hover:text-white underline decoration-dotted underline-offset-4">
              ABORT CONNECTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black transition-colors duration-1000">
      
      {/* --- UI OVERLAY LAYER --- */}
      <div 
        ref={uiRef} 
        id="xr-overlay"
        style={{ 
          position: 'absolute', 
          top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 10000, 
          pointerEvents: 'none', 
          background: 'transparent',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <GameHUD />

        {opponentDisconnected && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center pointer-events-auto z-[200]">
            <div className="bg-gray-900 border-2 border-neon-pink p-8 rounded-xl text-center shadow-[0_0_50px_#ff0055] max-w-sm mx-4">
              <h2 className="text-2xl text-neon-pink font-black mb-2 tracking-tighter">SIGNAL LOST</h2>
              <button onClick={handleExit} className="px-6 py-3 bg-white text-black font-bold tracking-widest rounded hover:bg-gray-200 transition-colors">
                RETURN TO BASE
              </button>
            </div>
          </div>
        )}
        
        {isARMode && !arStarted && !opponentDisconnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 pointer-events-auto p-4">
             {arError && (
               <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-white text-center rounded max-w-md">
                 <div className="font-bold mb-1">SYSTEM ERROR</div>
                 <div className="text-xs font-mono">{arError}</div>
               </div>
             )}
             <button 
              onClick={handleStartAR}
              className="px-8 py-4 bg-neon-green/20 border-2 border-neon-green text-neon-green font-black tracking-[0.2em] hover:bg-neon-green hover:text-black transition-all shadow-[0_0_30px_#00ff41] uppercase"
            >
              INITIALIZE AR UPLINK
            </button>
          </div>
        )}
      </div>

      {/* --- 3D SCENE LAYER --- */}
      {/* 
         CRITICAL OPTIMIZATION #2: 
         Single Canvas for everything (Game + Background) 
      */}
      <Canvas 
        className="z-10"
        dpr={[1, 1.5]} 
        gl={{ 
          powerPreference: "high-performance",
          antialias: !isARMode, // Disable AA in AR for performance
          stencil: true,
          depth: true,
          alpha: isARMode // Transparent canvas only needed for AR passthrough
        }} 
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        {isARMode ? (
           <XR store={store}>
             <Suspense fallback={null}>
               <VFXManager />
               <ARPlacement>
                 <QuantumBoard />
               </ARPlacement>
             </Suspense>
           </XR>
        ) : (
           <>
             {/* Background is now INSIDE the game canvas */}
             <BackgroundScene speed={backgroundSpeed} autoShift={false} />
             
             <OrbitControls 
               makeDefault
               minPolarAngle={0} 
               maxPolarAngle={Math.PI / 2.2}
               maxDistance={25}
               minDistance={5}
               enablePan={true}
             />
             
             <Suspense fallback={null}>
               <VFXManager />
               <QuantumBoard />
             </Suspense>
           </>
        )}
      </Canvas>

    </div>
  );
};

export default GameSession;