// src/engine/core/QuantumLogic.ts

export type Player = 'blue' | 'red' | null;
export type CellStatus = 'STABLE' | 'LOCKED' | 'FLUX';
export type GateType = 'Z' | 'X' | 'H';

export interface Qubit {
  id: number;
  x: number;
  y: number;
  owner: Player;
  status: CellStatus | null;
  fluxOwner: Player;
}

export const GRID_SIZE = 6;
export const TOTAL_CELLS = 36;

// --- 1. DETERMINISTIC RANDOM (PRNG) ---
// Critical for Multiplayer Sync: Both clients must generate the exact same "random" numbers
// given the same seed.
export const mulberry32 = (a: number) => {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
};

export const createInitialBoard = (): Qubit[] => {
  return Array.from({ length: TOTAL_CELLS }, (_, i) => ({
    id: i,
    x: Math.floor(i / GRID_SIZE),
    y: i % GRID_SIZE,
    owner: null,
    status: null,
    fluxOwner: null
  }));
};

const getIdx = (x: number, y: number) => {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return -1;
  return x * GRID_SIZE + y;
};

// --- CORE LOGIC ---

export const applyQuantumMove = (
  currentBoard: Qubit[],
  targetId: number,
  gate: GateType,
  activePlayer: Player,
  seed?: number
): Qubit[] => {
  // Clone board to avoid mutation side-effects
  const board = currentBoard.map(q => ({ ...q }));
  const centerNode = board[targetId];

  if (!centerNode || centerNode.status !== null) return currentBoard;

  // Initialize PRNG if seed provided, else fallback to Math.random (Local play without seed)
  const random = seed !== undefined ? mulberry32(seed) : Math.random;

  const enemy = activePlayer === 'blue' ? 'red' : 'blue';

  // 1. PRIMARY EFFECT (The clicked cell)
  if (gate === 'Z') {
    centerNode.status = 'LOCKED';
    centerNode.owner = activePlayer;
    return board; // Observer has no neighbors
  }
  else if (gate === 'X') {
    centerNode.status = 'STABLE';
    centerNode.owner = activePlayer;
  }
  else if (gate === 'H') {
    centerNode.status = 'FLUX';
    centerNode.owner = null;
    centerNode.fluxOwner = activePlayer;
  }

  // 2. SECONDARY EFFECTS (Neighbors)
  const cx = centerNode.x;
  const cy = centerNode.y;

  const neighbors = [
    // ORTHOGONAL (Zone 1) - Guaranteed Hit
    { dx: 0, dy: 1, isDiag: false },
    { dx: 0, dy: -1, isDiag: false },
    { dx: 1, dy: 0, isDiag: false },
    { dx: -1, dy: 0, isDiag: false },
    // DIAGONAL (Zone 2) - 50% Chance
    { dx: 1, dy: 1, isDiag: true },
    { dx: 1, dy: -1, isDiag: true },
    { dx: -1, dy: 1, isDiag: true },
    { dx: -1, dy: -1, isDiag: true }
  ];

  for (const { dx, dy, isDiag } of neighbors) {
    const idx = getIdx(cx + dx, cy + dy);
    if (idx === -1) continue;

    const target = board[idx];
    if (target.status === null || target.status === 'LOCKED') continue;

    // GATE LOGIC
    if (gate === 'X') {
      // Collider: 50% chance to fail on diagonals
      if (isDiag && random() > 0.5) continue;

      if (target.status === 'STABLE' && target.owner === enemy) {
        target.owner = activePlayer; // Capture
      }
      else if (target.status === 'FLUX') {
        target.status = 'STABLE';
        target.owner = activePlayer; // Stabilize
        target.fluxOwner = null;
      }
    }
    else if (gate === 'H') {
      // Entropy: Always hits neighbors (Chaos)
      if (target.status === 'STABLE' && target.owner === enemy) {
        target.status = 'FLUX';
        target.owner = null;
        target.fluxOwner = activePlayer;
      }
      else if (target.status === 'FLUX') {
        target.fluxOwner = activePlayer; // Steal Flux Control
      }
    }
  }

  return board;
};

export const collapseBoard = (currentBoard: Qubit[], seed?: number): Qubit[] => {
  const random = seed !== undefined ? mulberry32(seed) : Math.random;

  return currentBoard.map(q => {
    if (q.status === 'FLUX') {
      // 50/50 Collapse
      const winner = random() > 0.5 ? 'blue' : 'red';
      return {
        ...q,
        status: 'STABLE',
        owner: winner,
        fluxOwner: null
      };
    }
    return q;
  });
};

// --- UTILS ---

export const calculateScore = (board: Qubit[]) => {
  let blue = 0;
  let red = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i].owner === 'blue') blue++;
    if (board[i].owner === 'red') red++;
  }
  return { blue, red };
};

export const isBoardFull = (board: Qubit[]): boolean => {
  for (let i = 0; i < board.length; i++) {
    if (board[i].status === null) return false;
  }
  return true;
};