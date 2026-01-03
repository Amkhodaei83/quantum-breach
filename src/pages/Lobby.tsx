// src/pages/Lobby.tsx
import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { clsx } from 'clsx';

interface Room {
  id: string;
  players: number;
}

// OPTIMIZATION: Memoized Row Component
// This prevents the entire list from re-rendering when you type in the input box
const RoomItem = memo(({ room, onClick }: { room: Room; onClick: (id: string) => void }) => {
  return (
    <div
      onClick={() => onClick(room.id)}
      className="group cursor-pointer bg-black/40 border border-white/5 hover:border-fuchsia-500 hover:bg-fuchsia-900/10 p-4 rounded flex justify-between items-center transition-all mb-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full group-hover:shadow-[0_0_8px_#d946ef]"></div>
        <div className="font-bold text-white text-sm tracking-wide group-hover:text-fuchsia-400 transition-colors">
          {room.id}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-500 group-hover:text-fuchsia-300">
          WAITING
        </span>
        <span className="text-lg opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
          »
        </span>
      </div>
    </div>
  );
});

const Lobby = () => {
  const navigate = useNavigate();
  const joinMultiplayerRoom = useGameStore(state => state.joinMultiplayerRoom);
  const setARMode = useGameStore(state => state.setARMode);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isAR, setIsAR] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPageVisible = useRef(true);

  // --- BATTERY SAVER POLLING ---
  useEffect(() => {
    const handleVisibilityChange = () => { isPageVisible.current = document.visibilityState === 'visible'; };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const fetchRooms = useCallback(async () => {
    if (!isPageVisible.current) return;
    try {
      const res = await fetch('/api/rooms', { headers: { 'Accept': 'application/json' }, priority: 'low' } as any);
      if (res.ok) {
        const data = await res.json();
        // Only update if data actually changed to avoid list flicker
        setRooms(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    } catch (err) { console.warn("Lobby Poll Failed"); }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // --- ACTIONS ---
  const validateAndJoin = useCallback((roomId: string) => {
    // OPTIMIZATION: Client-side Sanitization
    const cleanId = roomId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (cleanId.length < 3) { setError("ID TOO SHORT"); return; }
    if (cleanId.length > 12) { setError("ID TOO LONG"); return; }
    
    // We access the *current* state of isAR via the store setter if needed, 
    // but here we use the local state before dispatching.
    setARMode(isAR);
    joinMultiplayerRoom(cleanId);
    navigate('/game');
  }, [isAR, joinMultiplayerRoom, navigate, setARMode]);

  const handleCreate = () => {
    if (!newRoomName) {
      const randomId = `SEC-${Math.floor(Math.random()*9000) + 1000}`;
      validateAndJoin(randomId);
    } else {
      validateAndJoin(newRoomName);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] text-white font-mono flex flex-col items-center overflow-hidden">
      
      {/* 1. HEADER */}
      <div className="z-20 w-full p-4 md:p-6 flex justify-between items-center border-b border-white/10 bg-black/20 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            NET_LOBBY
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></span>
            <p className="text-[10px] md:text-xs text-fuchsia-400 tracking-[0.2em]">
              SEARCHING FOR SIGNALS...
            </p>
          </div>
        </div>

        <Link to="/">
          <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white border border-transparent hover:border-gray-600 rounded transition-all bg-black/40">
            &lt; DISCONNECT
          </button>
        </Link>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="z-10 w-full max-w-md flex-1 flex flex-col gap-6 p-6 overflow-hidden">
        
        {/* --- SECTION A: COMMAND CENTER --- */}
        <div className="relative group shrink-0">
            <div className="absolute -left-2 -top-2 w-4 h-4 border-l-2 border-t-2 border-fuchsia-500/50"></div>
            <div className="absolute -right-2 -bottom-2 w-4 h-4 border-r-2 border-b-2 border-fuchsia-500/50"></div>

            <div className="bg-black/40 border border-white/10 backdrop-blur-md p-6 rounded-lg flex flex-col gap-4 shadow-lg">
                
                {/* Input */}
                <div>
                    <label className="text-[10px] font-bold text-fuchsia-400 tracking-widest mb-2 block">
                        TARGET FREQUENCY (ROOM ID)
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="AUTO-GENERATE" 
                            value={newRoomName}
                            onChange={(e) => { setError(null); setNewRoomName(e.target.value.toUpperCase()); }}
                            maxLength={12}
                            className="w-full bg-black/50 border border-white/20 p-4 text-white placeholder-gray-600 focus:border-fuchsia-500 outline-none rounded font-bold tracking-widest transition-colors uppercase"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-4 bg-fuchsia-500 animate-pulse"></div>
                    </div>
                    {error && (
                        <div className="text-[10px] text-red-500 font-bold mt-2 animate-pulse">
                            ⚠ ERROR: {error}
                        </div>
                    )}
                </div>

                {/* AR Toggle */}
                <div 
                    onClick={() => setIsAR(!isAR)}
                    className={clsx(
                        "cursor-pointer p-3 rounded border transition-all duration-300 flex items-center justify-between group/ar",
                        isAR ? "bg-neon-green/10 border-neon-green" : "bg-black/30 border-gray-700 hover:border-gray-500"
                    )}
                >
                    <div className="flex flex-col">
                        <span className={clsx("text-xs font-black tracking-widest transition-colors", isAR ? "text-neon-green" : "text-gray-400")}>
                            AR_PASSTHROUGH
                        </span>
                        <span className="text-[9px] text-gray-500">
                            {isAR ? "CAMERA FEED ACTIVE" : "STANDARD 3D VIEW"}
                        </span>
                    </div>
                    
                    <div className={clsx("w-10 h-5 rounded-full relative transition-colors", isAR ? "bg-neon-green" : "bg-gray-800")}>
                        <div className={clsx("absolute top-1 w-3 h-3 bg-black rounded-full shadow-md transition-transform duration-300", isAR ? "left-6" : "left-1")}></div>
                    </div>
                </div>

                {/* Join Button */}
                <button 
                    onClick={handleCreate}
                    className="w-full py-4 bg-fuchsia-600/20 border border-fuchsia-500 text-fuchsia-400 font-black tracking-[0.2em] hover:bg-fuchsia-500 hover:text-black transition-all rounded shadow-[0_0_15px_rgba(217,70,239,0.2)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] active:scale-[0.98]"
                >
                    ESTABLISH UPLINK
                </button>
            </div>
        </div>

        {/* --- SECTION B: SIGNAL FEED (Standard List) --- */}
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4 opacity-50 shrink-0">
                <div className="h-px flex-1 bg-gray-700"></div>
                <span className="text-[10px] font-bold text-gray-500 tracking-widest">ACTIVE SIGNALS</span>
                <div className="h-px flex-1 bg-gray-700"></div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {rooms.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-800 rounded bg-black/20">
                        <div className="text-2xl mb-2 opacity-30">📡</div>
                        <div className="text-xs text-gray-500 font-bold tracking-widest animate-pulse">SCANNING SECTOR...</div>
                        <div className="text-[10px] text-gray-700 mt-1">NO ACTIVE BEACONS FOUND</div>
                    </div>
                ) : (
                    rooms.map((room) => (
                        <RoomItem key={room.id} room={room} onClick={validateAndJoin} />
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Lobby;