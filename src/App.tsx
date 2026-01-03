// src/App.tsx
import React, { Suspense, lazy, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Canvas } from '@react-three/fiber'; // <--- IMPORT ADDED
import { useGameStore } from './store/gameStore';
import { Loader } from './components/dom/ui/Loader';
import BackgroundScene from './components/canvas/BackgroundScene';

// --- 1. EAGER LOADING ---
import Home from './pages/Home';

// --- 2. LAZY LOADING ---
const OfflineSetup = lazy(() => import('./pages/OfflineSetup'));
const Lobby = lazy(() => import('./pages/Lobby'));
const GameSession = lazy(() => import('./pages/GameSession'));
const GameGuide = lazy(() => import('./pages/GameGuide'));
const MinimaxInfo = lazy(() => import('./pages/MinimaxInfo'));

// --- 3. ERROR BOUNDARY ---
interface ErrorProps { children: ReactNode }
interface ErrorState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<ErrorProps, ErrorState> {
  constructor(props: ErrorProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-500 font-mono p-6 text-center">
          <h1 className="text-4xl font-black mb-4 tracking-widest border-b border-red-500 pb-2">SYSTEM FAILURE</h1>
          <p className="mb-8 text-sm opacity-80 max-w-md">
            CRITICAL ERROR DETECTED IN QUANTUM CORE.<br/>
            {this.state.error?.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 border border-red-500 hover:bg-red-500 hover:text-black font-bold tracking-[0.2em] transition-all rounded"
          >
            // REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 4. GLOBAL COMPONENTS ---

const GlobalLoaderWrapper = () => {
  const isLoading = useGameStore(state => state.isLoading);
  if (isLoading) return <Loader message="PROCESSING COMMAND" />;
  return null;
};

const GameLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isGameSession = location.pathname === '/game';

  return (
    <>
      {/* GLOBAL BACKGROUND (Only visible outside of the game session) */}
      {!isGameSession && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* FIX: Wrapped in Canvas because BackgroundScene is now just a mesh */}
          <Canvas 
            camera={{ position: [0, 0, 30], fov: 60 }}
            dpr={[1, 1.5]}
            gl={{ 
              powerPreference: "low-power", 
              antialias: false, 
              depth: false, 
              stencil: false 
            }}
          >
             <BackgroundScene speed={0.4} autoShift={true} />
          </Canvas>
          
          {/* Global Scanline Overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwMDAwIi8+CjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMCwgMjQzLCAyNTUsIDAuMSkiLz4KPC9zdmc+')] opacity-20"></div>
        </div>
      )}
      
      {children}
    </>
  );
};

// --- MAIN APP ---

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <GlobalLoaderWrapper />
        
        <GameLayout>
          <Suspense fallback={<Loader message="LOADING MODULES" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<OfflineSetup />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game" element={<GameSession />} />
              <Route path="/guide" element={<GameGuide />} />
              <Route path="/ai-logic" element={<MinimaxInfo />} />
            </Routes>
          </Suspense>
        </GameLayout>
        
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;