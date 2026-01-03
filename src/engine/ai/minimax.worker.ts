// src/engine/ai/minimax.worker.ts
import { type GateType, GRID_SIZE } from '../core/QuantumLogic';

// ==========================================
// PART 1: CONSTANTS & STATIC CACHES
// ==========================================

// --- 1.1 POSITION HEATMAP (Strategy) ---
// Higher numbers = more valuable territory (Center control is key)
const POSITION_VALUES = new Int8Array([
  2,  3,  4,  4,  3,  2,
  3,  6,  8,  8,  6,  3,
  4,  8, 12, 12,  8,  4,
  4,  8, 12, 12,  8,  4,
  3,  6,  8,  8,  6,  3,
  2,  3,  4,  4,  3,  2
]);

// --- 1.2 OPENING BOOK (Knowledge) ---
// Pre-calculated strong openings for high-difficulty AI (Red Player)
// Indexed by total moves on board (0, 1, 2...)
const OPENING_BOOK: Record<number, { id: number, gate: GateType }> = {
  // If Blue starts, Red responds:
  1: { id: 20, gate: 'Z' }, // Lock center-right immediately if available
  3: { id: 14, gate: 'X' }, // Aggressive center-left take
};
// --- HELPER: Random Shuffle for "Blind" AI ---
const shuffleArray = (array: number[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// <--- INSERT THE MISSING FUNCTION HERE --->
const getOpeningMove = (turns: number, difficulty: number): { id: number, gate: GateType } | null => {
  if (difficulty < 5) return null;
  return OPENING_BOOK[turns] || null;
};

// --- 1.3 NEIGHBOR CACHING (Performance) ---
const NEIGHBORS_CACHE = new Int16Array(36 * 8); 
const IS_DIAG_CACHE = new Uint8Array(36 * 8);   

(() => {
  const dirs = [
    { dx: 0, dy: 1, diag: 0 }, { dx: 0, dy: -1, diag: 0 }, // Orthogonal
    { dx: 1, dy: 0, diag: 0 }, { dx: -1, dy: 0, diag: 0 },
    { dx: 1, dy: 1, diag: 1 }, { dx: 1, dy: -1, diag: 1 }, // Diagonal
    { dx: -1, dy: 1, diag: 1 }, { dx: -1, dy: -1, diag: 1 }
  ];
  NEIGHBORS_CACHE.fill(-1);
  for (let i = 0; i < 36; i++) {
    const x = Math.floor(i / GRID_SIZE);
    const y = i % GRID_SIZE;
    dirs.forEach((d, idx) => {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        NEIGHBORS_CACHE[i * 8 + idx] = nx * GRID_SIZE + ny;
        IS_DIAG_CACHE[i * 8 + idx] = d.diag;
      }
    });
  }
})();

// ==========================================
// PART 2: CORE SIMULATION LOGIC
// ==========================================

/**
 * Counts non-empty cells to determine game phase.
 */
const countMoves = (board: Int8Array): number => {
  let count = 0;
  for(let i=0; i<36; i++) if(board[i] !== 0) count++;
  return count;
};

/**
 * Fast checking of neighbor counts for evaluation clustering.
 */
const countFriendlyNeighbors = (board: Int8Array, idx: number, owner: number): number => {
  let count = 0;
  for (let k = 0; k < 8; k++) {
    const nIdx = NEIGHBORS_CACHE[idx * 8 + k];
    if (nIdx !== -1 && Math.sign(board[nIdx]) === owner) count++;
  }
  return count;
};

/**
 * Byte-level move application.
 * Returns a NEW Int8Array representing the board state after the move.
 */
const applyMoveFast = (board: Int8Array, idx: number, gate: number, isBlue: boolean): Int8Array => {
  const next = new Int8Array(board); 
  const me = isBlue ? 1 : -1;
  const enemy = -me;

  // GATE CODES: 1=Z (Lock), 2=X (Collider), 3=H (Virus/Entropy)
  
  // 1. PRIMARY EFFECT
  if (gate === 1) { next[idx] = 2 * me; return next; } // Z: Locked (No neighbor effects)
  if (gate === 2) { next[idx] = 1 * me; } // X: Stable
  if (gate === 3) { next[idx] = 3 * me; } // H: Flux

  // 2. NEIGHBOR EFFECTS
  for (let k = 0; k < 8; k++) {
    const nIdx = NEIGHBORS_CACHE[idx * 8 + k];
    if (nIdx === -1) continue;
    
    const val = next[nIdx];
    if (val === 0 || Math.abs(val) === 2) continue; // Skip Empty or Locked

    const isDiag = IS_DIAG_CACHE[idx * 8 + k] === 1;

    // --- COLLIDER (X) ---
    if (gate === 2) {
      if (isDiag) continue; // AI Assumption: Diagonals always fail (Risk Aversion)
      
      // Capture Enemy Stable
      if (val === 1 * enemy) next[nIdx] = 1 * me;
      // Stabilize Flux (Neutral or Enemy)
      else if (Math.abs(val) === 3) next[nIdx] = 1 * me;
    }
    
    // --- VIRUS (H) ---
    else if (gate === 3) {
      // Destabilize Enemy Stable -> Flux
      if (val === 1 * enemy) next[nIdx] = 3 * me;
      // Steal Flux Control
      else if (Math.abs(val) === 3) next[nIdx] = 3 * me;
    }
  }

  return next;
};
// ==========================================
// PART 3: ADVANCED EVALUATION (HEURISTICS)
// ==========================================

/**
 * Calculates strategic threats.
 * Penalizes the AI if the enemy has created strong, connected clusters.
 */
const evaluateThreats = (board: Int8Array, me: number): number => {
  let threatScore = 0;
  const enemy = -me;
  
  for (let i = 0; i < 36; i++) {
    // Only look at enemy pieces
    if (Math.sign(board[i]) !== enemy) continue;
    
    // Check how fortified this enemy piece is
    const connections = countFriendlyNeighbors(board, i, enemy);
    
    // 3+ connections = Strong Cluster (Hard to penetrate)
    if (connections >= 3) threatScore -= 20; 
    // 5+ connections = Fortress (Very bad for us)
    if (connections >= 5) threatScore -= 40;
  }
  
  return threatScore;
};

/**
 * The brain of the AI. Determines how "good" a specific board state is.
 * Returns a score relative to 'me' (Higher is better).
 */
const evaluateAdvanced = (board: Int8Array, me: number): number => {
  let score = 0;
  
  for (let i = 0; i < 36; i++) {
    const val = board[i];
    if (val === 0) continue;
    
    const owner = Math.sign(val);
    const type = Math.abs(val); // 1=Stable, 2=Locked, 3=Flux
    
    // --- 1. MATERIAL SCORE ---
    let cellValue = 0;
    
    // Locked cells are permanent points, highly valuable
    if (type === 2) cellValue = 80; 
    // Stable cells are standard value
    else if (type === 1) cellValue = 25; 
    // Flux is risky/weak (could flip to enemy)
    else if (type === 3) cellValue = 10; 
    
    // --- 2. POSITIONAL SCORE ---
    // Add bonus based on heatmap (Center is worth more)
    cellValue += POSITION_VALUES[i] * 3;

    // --- 3. CLUSTERING SCORE ---
    // Bonus for protecting our own pieces
    const neighbors = countFriendlyNeighbors(board, i, owner);
    cellValue += neighbors * 6;

    // Apply score to owner
    if (owner === me) score += cellValue;
    else score -= cellValue;
  }
  
  // --- 4. THREAT ADJUSTMENT ---
  score += evaluateThreats(board, me);
  
  // --- 5. MOBILITY/AGENCY ---
  // If we are winning, push harder. If losing, take risks.
  // (Simplified as raw score usually handles this)

  return score;
};

// ==========================================
// PART 4: MOVE ORDERING
// ==========================================

/**
 * Sorts potential moves to maximize Alpha-Beta pruning efficiency.
 * We want to check the "best" moves first so we can discard bad branches early.
 */
const orderMoves = (board: Int8Array, moves: number[]): number[] => {
  return moves.sort((a, b) => {
    // 1. Prioritize Center (Heatmap)
    const scoreA = POSITION_VALUES[a];
    const scoreB = POSITION_VALUES[b];
    
    // 2. Prioritize moves next to existing pieces (Attack/Defend potential)
    // We check if the cell has ANY neighbors (friend or foe)
    let neighborsA = 0;
    let neighborsB = 0;
    
    for(let k=0; k<8; k++) {
        if(NEIGHBORS_CACHE[a*8+k] !== -1 && board[NEIGHBORS_CACHE[a*8+k]] !== 0) neighborsA++;
        if(NEIGHBORS_CACHE[b*8+k] !== -1 && board[NEIGHBORS_CACHE[b*8+k]] !== 0) neighborsB++;
    }

    // Sort descending: Higher score + more neighbors = check first
    return (scoreB + neighborsB * 2) - (scoreA + neighborsA * 2);
  });
};
// ==========================================
// PART 5: MINIMAX ALGORITHM
// ==========================================

const minimax = (
  board: Int8Array, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean, 
  rootPlayerSign: number,
  allowedGates: number[]
): number => {
  // 1. BASE CASE: Leaf node or Terminal state
  // We check for game over by seeing if board is full (no 0s)
  // Optimization: Just check depth first as it's cheaper
  if (depth === 0) {
    return evaluateAdvanced(board, rootPlayerSign);
  }

  // Check if board is full (Endgame)
  let emptyFound = false;
  for(let i=0; i<36; i++) { if(board[i] === 0) { emptyFound = true; break; } }
  if (!emptyFound) return evaluateAdvanced(board, rootPlayerSign);

  const currentPlayerIsBlue = isMaximizing ? (rootPlayerSign === 1) : (rootPlayerSign !== 1);

  // 2. MOVE GENERATION
  // Find all empty cells
  let moves: number[] = [];
  for(let i=0; i<36; i++) if(board[i] === 0) moves.push(i);

  // Optimization: Order moves to prune bad branches early
  moves = orderMoves(board, moves);

  // 3. RECURSION
  if (isMaximizing) {
    let maxEval = -Infinity;
    
    for (const id of moves) {
      for (const gate of allowedGates) {
        // Apply move
        const nextBoard = applyMoveFast(board, id, gate, currentPlayerIsBlue);
        
        // Recurse
        const evalScore = minimax(nextBoard, depth - 1, alpha, beta, false, rootPlayerSign, allowedGates);
        
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        
        // Prune
        if (beta <= alpha) break; 
      }
      if (beta <= alpha) break;
    }
    return maxEval;

  } else {
    let minEval = Infinity;
    
    for (const id of moves) {
      for (const gate of allowedGates) {
        const nextBoard = applyMoveFast(board, id, gate, currentPlayerIsBlue);
        
        const evalScore = minimax(nextBoard, depth - 1, alpha, beta, true, rootPlayerSign, allowedGates);
        
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        
        if (beta <= alpha) break;
      }
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

// ==========================================
// PART 6: SEARCH ORCHESTRATOR
// ==========================================

const searchBestMove = (
  board: Int8Array, 
  isBlue: boolean, 
  depth: number, 
  gateTypes: GateType[],
  scanLimit: number = 36, // NEW: How many cells to look at (Blindness)
  randomize: boolean = false // NEW: If true, ignore strategic sorting
) => {
  const me = isBlue ? 1 : -1;
  const allowedCodes = gateTypes.map(g => g === 'Z' ? 1 : g === 'X' ? 2 : 3);
  
  let bestScore = -Infinity;
  let bestMove = { id: -1, gate: gateTypes[0] }; 

  // 1. Get Moves
  let moves: number[] = [];
  for(let i=0; i<36; i++) if(board[i] === 0) moves.push(i);

  // 2. INTELLIGENCE FILTER
  if (randomize) {
    // DUMB AI: Shuffle moves randomly (doesn't know what's good)
    moves = shuffleArray(moves);
  } else {
    // SMART AI: Sort moves by strategy (Heatmap/Threats)
    moves = orderMoves(board, moves);
  }

  // 3. BLINDNESS FILTER
  // Only look at the first N moves.
  // If randomized, this means looking at N random spots on the board.
  const candidates = moves.slice(0, scanLimit);

  // 4. Evaluate Candidates
  for (const id of candidates) {
    for (const gateCode of allowedCodes) {
      const gateName = gateTypes[allowedCodes.indexOf(gateCode)];

      // Apply
      const nextBoard = applyMoveFast(board, id, gateCode, isBlue);
      
      // Call Minimax
      const score = minimax(nextBoard, depth - 1, -Infinity, Infinity, false, me, allowedCodes);

      // Update Best
      if (score > bestScore || (score === bestScore && Math.random() > 0.8)) {
        bestScore = score;
        bestMove = { id, gate: gateName };
      }
    }
  }

  // Fallback: If no move found (rare edge case with limits), pick first valid
  if (bestMove.id === -1 && moves.length > 0) {
    bestMove = { id: moves[0], gate: gateTypes[0] };
  }

  return bestMove;
};
// ==========================================
// PART 7: DIFFICULTY CONFIGURATION
// ==========================================

const findBestMove = (board: Int8Array, isBlue: boolean, difficulty: number) => {
  const currentTurn = countMoves(board);
  
  // --- LEVEL 1: BRAINLESS ---
  // Scans 1 random cell. Effectively pure RNG.
  if (difficulty <= 1) {
    return searchBestMove(board, isBlue, 1, ['X'], 1, true); 
  }

  // --- LEVEL 2: ROOKIE ---
  // Scans 3 random cells. Might find a capture, likely misses it.
  if (difficulty <= 2) {
    return searchBestMove(board, isBlue, 1, ['X'], 3, true); 
  }

  // --- LEVEL 3: BEGINNER ---
  // Scans 6 random cells. Sees ~20% of the board.
  if (difficulty <= 3) {
    return searchBestMove(board, isBlue, 1, ['X', 'Z'], 6, true); 
  }

  // --- LEVEL 4: AMATEUR ---
  // Scans 12 cells (33% of board). Depth 2.
  // Starts seeing threats but still makes positional mistakes.
  if (difficulty <= 4) {
    return searchBestMove(board, isBlue, 2, ['X', 'Z'], 12, true); 
  }

  // --- LEVEL 5-6: MEDIUM (Standard) ---
  // Sees everything (36), Strategy ON (False flag), Depth 3.
  if (difficulty <= 6) {
    const opening = getOpeningMove(currentTurn, difficulty);
    if (opening) return opening;
    return searchBestMove(board, isBlue, 3, ['X', 'Z', 'H'], 36, false);
  }

  // --- LEVEL 7-8: HARD ---
  // Depth 4 + Adaptive
  if (difficulty <= 8) {
    const opening = getOpeningMove(currentTurn, difficulty);
    if (opening) return opening;
    
    const emptyCount = 36 - currentTurn;
    const depth = emptyCount < 10 ? 5 : 4;

    return searchBestMove(board, isBlue, depth, ['X', 'Z', 'H'], 36, false);
  }

  // --- LEVEL 9-10: NIGHTMARE ---
  // Max Depth
  const opening = getOpeningMove(currentTurn, difficulty);
  if (opening) return opening;
  
  const emptyCount = 36 - currentTurn;
  const depth = emptyCount < 8 ? 6 : 4; 
  
  return searchBestMove(board, isBlue, depth, ['X', 'Z', 'H'], 36, false);
};

// ==========================================
// PART 8: WORKER INTERFACE
// ==========================================

self.onmessage = (e: MessageEvent) => {
  const { board, player, difficulty } = e.data;
  
  // Cast raw buffer to TypedArray
  const byteBoard = board as Int8Array;
  const isBlue = player === 'blue';

  try {
    const start = Date.now();
    
    // 1. Compute Move
    const bestMove = findBestMove(byteBoard, isBlue, difficulty);
    
    // 2. Simulate "Thinking" Time
    // Higher difficulty = Artificial delay to simulate "deep thought"
    // This adds tension to the game UI
    const elapsed = Date.now() - start;
    const minDelay = 400 + (difficulty * 100); // 500ms to 1.5s
    
    const remainingDelay = Math.max(0, minDelay - elapsed);

    setTimeout(() => {
        postMessage(bestMove);
    }, remainingDelay);

  } catch (err) {
    console.error("AI CRITICAL FAILURE:", err);
    // Fallback: Return first available move to prevent crash
    for(let i=0; i<36; i++) {
        if(byteBoard[i] === 0) {
            postMessage({ id: i, gate: 'X' });
            break;
        }
    }
  }
};