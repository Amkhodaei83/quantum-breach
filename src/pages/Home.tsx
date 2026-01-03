// src/pages/Home.tsx
import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Logo } from '../components/dom/ui/logo';

const Home = () => {
  const soloBtnRef = useRef<HTMLAnchorElement>(null);
  const lobbyBtnRef = useRef<HTMLAnchorElement>(null);

  // OPTIMIZATION #5: Intelligent Preloading
  // Instead of loading everything at once, we load when user shows intent (hovers/sees buttons)
  const preloadCritical = useCallback(() => {
    import('./GameSession'); 
    import('../components/canvas/board/QuantumBoard');
    import('../engine/core/QuantumLogic');
  }, []);

  const preloadLobby = useCallback(() => import('./Lobby'), []);
  const preloadDocs = useCallback(() => { import('./GameGuide'); import('./MinimaxInfo'); }, []);

  useEffect(() => {
    // Observer to preload game when buttons are visible on screen
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadCritical();
          observer.disconnect(); // Only need to trigger once
        }
      });
    }, { threshold: 0.5 });

    if (soloBtnRef.current) observer.observe(soloBtnRef.current);

    return () => observer.disconnect();
  }, [preloadCritical]);

  // --- LIQUID GLASS BUTTON ---
  const LiquidButton = ({ to, label, icon, colorClass, borderClass, onHover, refProp }: any) => (
    <Link to={to} ref={refProp} className="w-full group/btn relative">
      <button 
        onMouseEnter={onHover}
        onTouchStart={onHover}
        className={`
          relative w-full py-5 px-6 rounded-lg overflow-hidden transition-all duration-300
          bg-black/10 hover:bg-black/30 
          backdrop-blur-md 
          border ${borderClass}
          shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.4)]
        `}
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <span className={`text-2xl filter drop-shadow-sm ${colorClass} opacity-80 group-hover/btn:opacity-100 transition-opacity`}>
              {icon}
            </span>
            <span className={`font-black tracking-[0.2em] text-sm md:text-base ${colorClass} drop-shadow-md`}>
              {label}
            </span>
          </div>
          
          {/* Tech Arrow */}
          <div className={`opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300 ${colorClass}`}>
            »
          </div>
        </div>
      </button>
    </Link>
  );

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      
      {/* MAIN CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="z-10 w-full max-w-sm px-6 flex flex-col gap-10 relative"
      >
        
        {/* --- DECORATIVE BRACKETS --- */}
        <div className="absolute -left-2 -top-6 w-8 h-8 border-l-2 border-t-2 border-white/10"></div>
        <div className="absolute -right-2 -bottom-6 w-8 h-8 border-r-2 border-b-2 border-white/10"></div>

        {/* LOGO */}
        <Logo scale={1.0} />

        {/* --- MAIN BUTTONS --- */}
        <div className="flex flex-col gap-4">
          
          {/* SINGLE PLAYER */}
          <LiquidButton 
            refProp={soloBtnRef}
            to="/setup" 
            label="SINGLE PLAYER" 
            icon="⚡"
            colorClass="text-cyan-400 group-hover/btn:text-cyan-200"
            borderClass="border-cyan-500/30 group-hover/btn:border-cyan-400/80"
            onHover={preloadCritical} 
          />

          {/* MULTIPLAYER */}
          <LiquidButton 
            refProp={lobbyBtnRef}
            to="/lobby" 
            label="MULTIPLAYER" 
            icon="🌐"
            colorClass="text-fuchsia-400 group-hover/btn:text-fuchsia-200"
            borderClass="border-fuchsia-500/30 group-hover/btn:border-fuchsia-400/80"
            onHover={preloadLobby} 
          />

        </div>

        {/* --- SECONDARY LINKS --- */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/guide" onMouseEnter={preloadDocs} className="group/small">
            <div className="h-full py-3 rounded bg-black/10 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all text-center">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 group-hover/small:text-white transition-colors">MANUAL</span>
            </div>
          </Link>
          
          <Link to="/ai-logic" onMouseEnter={preloadDocs} className="group/small">
            <div className="h-full py-3 rounded bg-black/10 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all text-center">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 group-hover/small:text-white transition-colors">AI_CORE</span>
            </div>
          </Link>
        </div>

      </motion.div>

      {/* FOOTER */}
      <a 
        href="https://github.com/Amkhodaei83" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute bottom-6 z-20 group cursor-pointer"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/5 hover:border-white/20 backdrop-blur-sm transition-all hover:scale-105">
          <span className="text-[9px] text-gray-500 tracking-widest group-hover:text-gray-400 transition-colors">
            CODED_BY //
          </span>
          <span className="text-[10px] font-black text-white tracking-widest group-hover:text-cyan-400 transition-colors">
            AMIR HOSSEIN KHODAEI
          </span>
        </div>
      </a>

    </div>
  );
};

export default Home;