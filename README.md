# ⚛️ Quantum Breach

![Project Banner](https://img.shields.io/badge/Status-Live-success) ![Tech](https://img.shields.io/badge/Engine-React_Three_Fiber-black) ![Mode](https://img.shields.io/badge/Mode-WebXR_%2F_AR-blue)

> **A high-fidelity, turn-based strategy game built on the modern web. Featuring Minimax AI, deterministic multiplayer, and augmented reality support.**

🔗 **[Play Live Demo](https://quantum-breach.vercel.app/)**

---

## 📋 Overview

**Quantum Breach** is a cyberpunk-themed strategy game where players compete to control a 6x6 quantum grid. The project serves as a technical showcase of high-performance 3D rendering in the browser, complex state management, and algorithmic AI implementation without blocking the main thread.

### Key Features
*   **🧠 Advanced AI:** Custom Minimax algorithm with Alpha-Beta pruning running on Web Workers.
*   **⚔️ Real-time Multiplayer:** Deterministic state synchronization via WebSockets (Socket.io).
*   **👓 WebXR / AR:** Fully functional Augmented Reality mode with plane detection (Hit-Testing).
*   **🚀 Performance:** Optimized via Geometry Instancing and React-independent state updates (Zustand).

---

## 🛠 Tech Stack

### Core
*   **Frontend:** React 19, TypeScript, Vite
*   **State Management:** Zustand (Transient updates for 60FPS)
*   **Styling:** Tailwind CSS

### Graphics & Immersion
*   **3D Engine:** Three.js, React Three Fiber (R3F), Drei
*   **AR/VR:** @react-three/xr
*   **Motion:** Framer Motion

### Backend & Logic
*   **Server:** Node.js, Express
*   **Transport:** Socket.io (WebSocket)
*   **Compute:** Web Workers (Off-main-thread AI processing)

---

## 🧩 Architecture & Engineering

### 1. The Artificial Intelligence (Minimax)
The AI does not rely on simple heuristics. It simulates the game tree up to a depth of 6 moves.
*   **Utility Function:** Evaluates board states based on Material, Positional Heatmaps, and Clustering.
*   **Probabilistic Logic:** Handles the "Injector" gate's 50% failure rate using Expected Utility Theory.
*   **Optimization:** Uses `Int8Array` and `Transferable Objects` to pass memory between the Main Thread and the Worker thread with zero-copy overhead.

### 2. Deterministic Multiplayer
To ensure a lag-free experience on minimal bandwidth:
*   **Input Streaming:** Instead of synchronizing the entire board state (36 objects), clients send only the `Move Input` and a `Random Seed`.
*   **PRNG Sync:** Both clients use a custom implementation of the Mulberry32 algorithm. By sharing the seed, both simulations resolve random quantum events identically on both screens.

### 3. Rendering Optimizations
*   **InstancedMesh:** The background scene and grid lines use geometry instancing to render hundreds of objects in a single draw call.
*   **Zustand Transient Updates:** The game loop binds directly to the store, bypassing React's render cycle for smooth frame-by-frame animation.

---

## 🎮 How to Play

The goal is to occupy the majority of the **Quantum Bits (Qubits)** before the system reaches 100% Instability (Grid Full).

You have three programs in your arsenal:
1.  **INJECTOR (X):** Aggressive. Captures a node and attacks orthogonal neighbors. *Weakness: 50% failure chance on diagonals.*
2.  **FIREWALL (Z):** Defensive. Permanently locks a node. It cannot be flipped or stolen.
3.  **VIRUS (H):** Chaos. Turns a node into **FLUX** state. When the game ends, Flux nodes collapse randomly to either player.

---

## 💻 Local Setup

Clone the repository and install dependencies.

```bash
git clone https://github.com/Amkhodaei83/quantum-breach.git
cd quantum-breach
npm install
```

### Running Development Environment
You need two terminals (one for Frontend, one for Backend).

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend/Socket Server):**
```bash
node server/index.js
```

Open `http://localhost:5173` (or the port shown in terminal) to play.

---

## 📁 Directory Structure

```text
src/
├── components/
│   ├── canvas/       # 3D Scenes (Three.js/R3F)
│   │   ├── ar/       # AR Logic & Placement
│   │   └── board/    # Game Board Visuals
│   └── dom/          # 2D UI Overlays (HUD)
├── engine/
│   ├── ai/           # Minimax Worker & Heuristics
│   └── core/         # Game Rules & Geometry Managers
├── pages/            # Routing (Home, Lobby, Game)
├── store/            # Zustand Game State
└── server/           # Node.js WebSocket Server
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

