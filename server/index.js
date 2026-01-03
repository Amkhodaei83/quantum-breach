// server/index.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

// --- CONFIG ---
// const PORT = 3000;
const PORT = process.env.PORT || 3000;
const GRID_SIZE = 6;
const TOTAL_CELLS = 36;
const MOVE_RATE_LIMIT_MS = 200; // Max 5 moves per second

// --- APP SETUP ---
const app = express();
app.use(cors({ origin: "*" })); // In production, replace "*" with your domain
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 10000,
});

// --- STATE MANAGEMENT ---
const rooms = new Map();
const rateLimiter = new Map(); // Tracks last move time per socket

// --- HELPER: GAME LOGIC ---

const createBoard = () => Array.from({ length: TOTAL_CELLS }, (_, i) => ({
  id: i,
  x: Math.floor(i / GRID_SIZE),
  y: i % GRID_SIZE,
  owner: null,
  status: null, 
  fluxOwner: null
}));

// OPTIMIZATION #11: Strict Validation
const validateMove = (board, nodeId, gate, player) => {
  // 1. Type Safety
  if (typeof nodeId !== 'number' || !Number.isInteger(nodeId)) return false;
  if (typeof gate !== 'string') return false;

  // 2. Bounds Check
  if (nodeId < 0 || nodeId >= TOTAL_CELLS) return false;

  // 3. Gate Validity
  if (!['Z', 'X', 'H'].includes(gate)) return false;

  // 4. Game Rule: Placement must be on empty cell
  const node = board[nodeId];
  if (!node || node.status !== null) return false; 

  return true;
};

const applyServerMove = (board, nodeId, gate, player) => {
  const node = board[nodeId];
  // Basic state update for server authority
  // Detailed physics are deterministic via Seed on client
  if (gate === 'Z') {
    node.status = 'LOCKED';
    node.owner = player;
  } else if (gate === 'X') {
    node.status = 'STABLE';
    node.owner = player;
  } else if (gate === 'H') {
    node.status = 'FLUX';
    node.owner = null;
    node.fluxOwner = player;
  }
  return board;
};

// --- SOCKET HANDLERS ---

io.on('connection', (socket) => {
  console.log(`🔌 [${socket.id}] Connected`);

  // --- JOIN ROOM ---
  socket.on('join_room', (rawRoomId) => {
    // Sanitization
    if (!rawRoomId || typeof rawRoomId !== 'string') return;
    const roomId = rawRoomId.trim().toUpperCase().slice(0, 12);

    let room = rooms.get(roomId);

    // Create Room if not exists
    if (!room) {
      room = { 
        id: roomId,
        blue: null, 
        red: null, 
        board: createBoard(), 
        turn: 'blue', 
        status: 'waiting',
        lastMoveTime: Date.now()
      };
      rooms.set(roomId, room);
    }

    // Full Room Check
    if (room.blue && room.red) {
      socket.emit('error', 'Room is full.');
      return;
    }

    // Assign Role
    let role = 'spectator';
    if (!room.blue) { 
      room.blue = socket.id; 
      role = 'blue'; 
    } else if (!room.red) { 
      room.red = socket.id; 
      role = 'red'; 
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = role;
    
    socket.emit('role_assigned', role);
    console.log(`👤 [${socket.id}] Joined ${roomId} as ${role}`);

    // Start Game
    if (room.blue && room.red) {
      room.status = 'playing';
      io.to(roomId).emit('game_start', { startTurn: 'blue' });
      console.log(`⚔️ Game Started: ${roomId}`);
    }
  });

  // --- MAKE MOVE ---
  socket.on('make_move', (data) => {
    // OPTIMIZATION #12: Rate Limiting
    const now = Date.now();
    const lastRequest = rateLimiter.get(socket.id) || 0;
    if (now - lastRequest < MOVE_RATE_LIMIT_MS) {
        // Silently ignore spam
        return;
    }
    rateLimiter.set(socket.id, now);

    const { roomId, nodeId, gate, seed } = data;
    const room = rooms.get(roomId);

    if (!room) return;
    if (room.status !== 'playing') return;
    
    // SECURITY: Turn Order
    if (room.turn !== socket.role) {
      console.warn(`⚠️ [${socket.id}] Attempted move out of turn!`);
      return; 
    }

    // SECURITY: Validation
    if (!validateMove(room.board, nodeId, gate, socket.role)) {
      console.warn(`⚠️ [${socket.id}] Attempted invalid move on cell ${nodeId}`);
      return; 
    }

    // Update Server State
    room.board = applyServerMove(room.board, nodeId, gate, socket.role);
    
    // Switch Turn
    room.turn = room.turn === 'blue' ? 'red' : 'blue';
    room.lastMoveTime = Date.now();

    // Broadcast
    socket.to(roomId).emit('opponent_move', {
      nodeId,
      gate,
      seed // Relay deterministic seed
    });
  });

  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    rateLimiter.delete(socket.id); // Cleanup rate limiter
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        console.log(`💔 [${socket.id}] Left ${socket.roomId}`);
        io.to(socket.roomId).emit('player_left');
        
        // Cleanup room if empty
        if ((room.blue === socket.id && !room.red) || (room.red === socket.id && !room.blue)) {
             rooms.delete(socket.roomId);
        } else {
            // Remove player from slot so they can potentially reconnect or someone else can join
            if (room.blue === socket.id) room.blue = null;
            if (room.red === socket.id) room.red = null;
        }
      }
    }
  });
});

// --- API ---
app.get('/api/rooms', (req, res) => {
  const list = [];
  rooms.forEach((r) => {
    if (r.status === 'waiting') {
      list.push({ id: r.id, players: r.blue ? 1 : 0 });
    }
  });
  res.json(list);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Secure Quantum Server running on port ${PORT}`);
});