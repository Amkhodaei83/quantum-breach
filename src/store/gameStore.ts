// src/store/gameStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { 
  createInitialBoard, 
  applyQuantumMove, 
  collapseBoard, 
  calculateScore,
  isBoardFull,
  TOTAL_CELLS,
  type GateType,
  type Qubit,
  type Player
} from '../engine/core/QuantumLogic';

// OPTIMIZATION #4: Robust Worker Queue
import MinimaxWorker from '../engine/ai/minimax.worker?worker';

class WorkerQueue {
  private workers: Worker[] = [];
  private busy: boolean[] = [];
  private queue: Array<{ data: any, resolve: (val: any) => void }> = [];

  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      this.workers.push(new MinimaxWorker());
      this.busy.push(false);
      this.workers[i].onmessage = (e) => this.onWorkerMessage(i, e.data);
    }
  }

  compute(board: Qubit[], difficulty: number, player: Player): Promise<any> {
    return new Promise((resolve) => {
      // OPTIMIZATION #7: Serialize Board to Int8Array
      const serializedBoard = new Int8Array(36);
      board.forEach((q, i) => {
        if (q.status === null) serializedBoard[i] = 0;
        else {
          const sign = (q.owner === 'blue' || q.fluxOwner === 'blue') ? 1 : -1;
          if (q.status === 'STABLE') serializedBoard[i] = 1 * sign;
          else if (q.status === 'LOCKED') serializedBoard[i] = 2 * sign;
          else if (q.status === 'FLUX') serializedBoard[i] = 3 * sign;
        }
      });
      
      // Transferable object structure
      const taskData = { 
        board: serializedBoard, // Int8Array
        difficulty, 
        player 
      };

      const availableWorkerId = this.busy.findIndex(b => !b);
      if (availableWorkerId !== -1) {
        this.runWorker(availableWorkerId, taskData, resolve);
      } else {
        this.queue.push({ data: taskData, resolve });
      }
    });
  }

  private runWorker(id: number, taskData: any, resolve: (val: any) => void) {
    this.busy[id] = true;
    // Store resolve function on the worker instance (hacky but fast) or map
    (this.workers[id] as any)._currentResolve = resolve;
    // Optimization: Transfer buffer ownership to worker
    this.workers[id].postMessage(taskData, [taskData.board.buffer]);
  }

  private onWorkerMessage(id: number, result: any) {
    const resolve = (this.workers[id] as any)._currentResolve;
    if (resolve) resolve(result);
    this.busy[id] = false;

    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.runWorker(id, next.data, next.resolve);
    }
  }
}

const aiSystem = new WorkerQueue(2); // Pool of 2 workers

let socket: Socket | null = null;
let reconnectInterval: ReturnType<typeof setInterval> | null = null;

interface GameState {
  board: Qubit[];
  currentPlayer: Player; 
  turns: number;
  instability: number;
  status: 'idle' | 'playing' | 'collapsing' | 'gameover' | 'waiting_for_opponent';
  winner: Player | 'draw' | null;
  scores: { blue: number, red: number };
  
  selectedGate: GateType;
  draggingGate: GateType | null;
  hoveredCell: number | null;

  isARMode: boolean;
  difficulty: number;
  isAIThinking: boolean; 

  arScale: number; 
  isARPlaced: boolean;

  isMultiplayer: boolean;
  myRole: Player;
  roomId: string | null;
  opponentDisconnected: boolean;
  isLoading: boolean;

  setSelectedGate: (gate: GateType) => void;
  setDraggingGate: (gate: GateType | null) => void;
  setHoveredCell: (id: number | null) => void;
  setARMode: (enabled: boolean) => void;
  setARPlaced: (placed: boolean) => void;
  setLoading: (loading: boolean) => void;

  startGame: (difficulty: number) => void;
  joinMultiplayerRoom: (roomId: string) => void;
  exitGame: () => void;
  executeMove: (nodeId: number, gate: GateType, isNetworkMove?: boolean, networkSeed?: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createInitialBoard(),
  currentPlayer: 'blue', 
  turns: 0,
  instability: 0,
  status: 'idle',
  winner: null,
  scores: { blue: 0, red: 0 },
  selectedGate: 'X', 
  draggingGate: null,
  hoveredCell: null,
  isARMode: false,
  difficulty: 3,
  isAIThinking: false, 
  arScale: 0.04, 
  isARPlaced: false,
  isMultiplayer: false,
  myRole: null,
  roomId: null,
  opponentDisconnected: false,
  isLoading: false,

  setSelectedGate: (gate) => set({ selectedGate: gate }),
  setDraggingGate: (gate) => set({ draggingGate: gate }),
  setHoveredCell: (id) => set({ hoveredCell: id }),
  setARMode: (enabled) => set({ isARMode: enabled }),
  setARPlaced: (placed) => set({ isARPlaced: placed }),
  setLoading: (loading) => set({ isLoading: loading }),

  startGame: (difficulty) => {
    set({ isLoading: true });
    setTimeout(() => {
        set({
          board: createInitialBoard(),
          difficulty: difficulty,
          currentPlayer: 'blue',
          turns: 0,
          instability: 0,
          status: 'playing',
          winner: null,
          scores: { blue: 0, red: 0 },
          isMultiplayer: false,
          opponentDisconnected: false,
          isAIThinking: false,
          hoveredCell: null,
          isARPlaced: false,
          isLoading: false 
        });
    }, 500);
  },

  joinMultiplayerRoom: (roomId) => {
    const sanitizedId = roomId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
    const BACKEND_URL = import.meta.env.PROD 
  ? "https://your-backend-app-name.onrender.com" // You will get this URL in Phase 3
  : ""; // Empty string means use localhost/proxy in dev
  socket = io(BACKEND_URL, { 
  path: '/socket.io',
  reconnectionAttempts: 5,
  transports: ['websocket'] 
});
    if (sanitizedId.length < 3) return;

    set({ isLoading: true });

    if (socket) {
        socket.removeAllListeners(); // OPTIMIZATION #3: Clear old listeners
        socket.disconnect();
    }
    
    socket = io({ 
      path: '/socket.io',
      reconnectionAttempts: 5,
      transports: ['websocket'] 
    });

    socket.emit('join_room', sanitizedId);

    set({ 
      isMultiplayer: true, 
      roomId: sanitizedId, 
      status: 'waiting_for_opponent',
      board: createInitialBoard(),
      turns: 0,
      instability: 0,
      scores: { blue: 0, red: 0 },
      opponentDisconnected: false,
      hoveredCell: null,
      isARPlaced: false,
      isLoading: false 
    });

    // --- SOCKET HANDLERS ---
    const setupHandlers = (s: Socket) => {
        s.removeAllListeners(); // Ensure cleanliness
        
        s.on('role_assigned', (role: Player) => set({ myRole: role }));
        
        s.on('game_start', () => {
          set({ status: 'playing', currentPlayer: 'blue' });
        });
        
        s.on('opponent_move', (data) => {
          get().executeMove(data.nodeId, data.gate, true, data.seed);
        });

        s.on('disconnect', () => {
          set({ opponentDisconnected: true });
          
          let attempts = 0;
          reconnectInterval = setInterval(() => {
            if (!s || attempts >= 5) {
              if (reconnectInterval) clearInterval(reconnectInterval);
              return;
            }
            console.log('Attempting reconnection...');
            s.connect();
            attempts++;
          }, 2000);
        });

        s.on('connect', () => {
            if (reconnectInterval) clearInterval(reconnectInterval);
            set({ opponentDisconnected: false });
            if (get().roomId) s.emit('join_room', get().roomId);
        });

        s.on('player_left', () => {
          set({ opponentDisconnected: true });
        });
    };

    setupHandlers(socket);
  },

  exitGame: () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    if (reconnectInterval) clearInterval(reconnectInterval);
    
    set({
      status: 'idle',
      isMultiplayer: false,
      opponentDisconnected: false,
      winner: null,
      board: createInitialBoard(),
      hoveredCell: null,
      isAIThinking: false,
      isLoading: false
    });
  },

  executeMove: (nodeId, gate, isNetworkMove = false, networkSeed?: number) => {
    const state = get();
    if (state.status !== 'playing') return;
    if (!isNetworkMove && state.isAIThinking) return;

    const moveSeed = isNetworkMove && networkSeed !== undefined ? networkSeed : Math.floor(Math.random() * 1000000);

    if (state.isMultiplayer && !isNetworkMove) {
      if (state.currentPlayer !== state.myRole) return;
      if (!socket) return;
      socket.emit('make_move', { roomId: state.roomId, nodeId, gate, seed: moveSeed });
    }

    const targetNode = state.board[nodeId];
    if (!targetNode || targetNode.status !== null) return;

    // Apply Move
    const newBoard = applyQuantumMove(state.board, nodeId, gate, state.currentPlayer, moveSeed);
    const newTurns = state.turns + 1;
    const newInstability = (newTurns / TOTAL_CELLS) * 100;
    const currentScores = calculateScore(newBoard);

    // End Game Check
    if (newTurns >= TOTAL_CELLS || isBoardFull(newBoard)) {
      // OPTIMIZATION #5: Batched Update (Collapse)
      set({ 
          board: newBoard, 
          turns: newTurns, 
          instability: 100, 
          status: 'collapsing', 
          draggingGate: null, 
          isAIThinking: false 
      });
      
      setTimeout(() => {
        const finalBoard = collapseBoard(newBoard, moveSeed);
        const finalScores = calculateScore(finalBoard);
        let winner: Player | 'draw' = 'draw';
        if (finalScores.blue > finalScores.red) winner = 'blue';
        if (finalScores.red > finalScores.blue) winner = 'red';
        
        set({ board: finalBoard, scores: finalScores });
        setTimeout(() => { set({ status: 'gameover', winner: winner }); }, 2500);
      }, 1500);
      return;
    }

    const nextPlayer = state.currentPlayer === 'blue' ? 'red' : 'blue';

    // OPTIMIZATION #5: Batched Update (Next Turn)
    set({ 
        board: newBoard, 
        turns: newTurns, 
        instability: newInstability, 
        currentPlayer: nextPlayer, 
        scores: currentScores, 
        draggingGate: null 
    });

    // AI Trigger
    if (!state.isMultiplayer && nextPlayer === 'red') {
      set({ isAIThinking: true });
      
      aiSystem.compute(newBoard, state.difficulty, 'red')
        .then((aiMove) => {
             // Small delay for pacing
             setTimeout(() => {
                set({ isAIThinking: false }); 
                if (aiMove) get().executeMove(aiMove.id, aiMove.gate, true); 
             }, 400);
        });
    }
  },
}));

// Selectors
export const useScores = () => useGameStore(state => state.scores);
export const useInstability = () => useGameStore(state => state.instability);
export const useBoard = () => useGameStore(state => state.board);
export const useStatus = () => useGameStore(state => state.status);