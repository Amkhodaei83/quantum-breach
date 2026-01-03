// src/components/dom/ui/Loader.tsx
import { motion } from 'framer-motion';

export const Loader = ({ message = "SYSTEM INITIALIZING" }: { message?: string }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center cursor-wait">
      {/* Background Pulse */}
      <div className="absolute inset-0 bg-neon-blue/5 animate-pulse" />
      
      {/* Spinner */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
        {/* Spinning Segment */}
        <motion.div 
          className="absolute inset-0 border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner Counter-Spin */}
        <motion.div 
          className="absolute inset-2 border-4 border-t-transparent border-r-neon-pink border-b-transparent border-l-transparent rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-black text-white tracking-[0.3em] animate-pulse">
          {message}
        </h2>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
          <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
          <span className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-[10px] text-gray-500 font-mono">
        ENCRYPTING DATA STREAM // DO NOT TURN OFF
      </div>
    </div>
  );
};