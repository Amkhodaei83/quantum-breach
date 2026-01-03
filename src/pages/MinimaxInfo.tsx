// src/pages/MinimaxInfo.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

// --- TYPES ---

type Lang = 'en' | 'fa';

// Discriminated Union for different content block types
type BlockType = 'paragraph' | 'code' | 'list' | 'formula' | 'card';

interface BaseBlock {
  type: BlockType;
}

interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
}

interface CodeBlock extends BaseBlock {
  type: 'code';
  language?: string; // e.g., "PYTHON", "PSEUDOCODE"
  code: string;
}

interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
}

interface FormulaBlock extends BaseBlock {
  type: 'formula';
  math: string;
}

interface CardBlock extends BaseBlock {
  type: 'card';
  title: string;
  content: string | string[]; // Can be a simple string or a list of items
}

type ContentBlock = ParagraphBlock | CodeBlock | ListBlock | FormulaBlock | CardBlock;

interface Section {
  id: string;
  title: string;
  color: string;
  blocks: ContentBlock[]; // Changed from simple 'body' string to array of blocks
  footer?: string;
}

interface PageContent {
  title: string;
  subtitle: string;
  sections: Section[];
  back: string;
}

// --- DATA STRUCTURE (EMPTY) ---

const CONTENT: Record<Lang, PageContent> = {
  en: {
    title: "NEURAL_CORE",
    subtitle: "ALGORITHMIC_ANALYSIS_V4.0",
    sections: [
  {
    id: "intro",
    title: "01 // INTRODUCTION & PROJECT OVERVIEW",
    color: "text-blue-400",
    blocks: [
      {
        type: "paragraph",
        text: "Project Quantum Breach is a turn-based strategy game inspired by quantum computing and cybersecurity concepts. Running on the web platform, it aims to deliver a high-end graphical experience using modern web technologies."
      },
      {
        type: "card",
        title: "TECH STACK",
        content: [
          "Frontend Framework: React 19 (UI & State)",
          "3D Engine: Three.js + React Three Fiber",
          "State Management: Zustand",
          "Build Tool: Vite",
          "Styling: Tailwind CSS",
          "Language: TypeScript",
          "XR/AR: WebXR + React Three XR",
          "Backend: Node.js + Express + Socket.io"
        ]
      },
      {
        type: "paragraph",
        text: "The core game operates on a 6x6 grid where players (Hacker vs AI/Security) use three types of logic gates (Firewall, Injector, Virus) to control Qubits. The main technical challenge was implementing a powerful browser-based AI without blocking the main thread, alongside a lag-free multiplayer experience using deterministic synchronization."
      }
    ]
  },
  {
    id: "ai-minimax",
    title: "02 // NEURAL CORE: MINIMAX & SEARCH ANALYSIS",
    color: "text-green-400",
    blocks: [
      {
        type: "paragraph",
        text: "The game's mastermind is a custom AI engine built on the Minimax algorithm with Alpha-Beta Pruning. Unlike many web games using simple 'if-else' logic, this AI simulates the game tree to a specific depth (4-6 layers depending on difficulty)."
      },
      {
        type: "paragraph",
        text: "To distinguish between 'good' and 'bad' states, it employs a deterministic Utility Function. This function assigns a numerical score U(s) to every board state:"
      },
      {
        type: "formula",
        math: "U(s) = (W_m · M(s)) + (W_p · P(s)) + (W_c · C(s)) - (W_t · T(s))"
      },
      {
        type: "list",
        items: [
          "M(s) (Material): Net piece value. Locked gates are worth 3x more than Stable gates due to invulnerability.",
          "P(s) (Positional): Strategic value based on Heatmap. Center nodes allow access to more neighbors.",
          "C(s) (Clustering): Bonus for creating chains of connected friendly nodes.",
          "T(s) (Threats): Penalty if pieces are under immediate attack."
        ]
      },
      {
        type: "card",
        title: "HEATMAP IMPLEMENTATION",
        content: "The array below (from minimax.worker.ts) defines the intrinsic value of every cell. Higher numbers (12) indicate the strategic center, while lower numbers (2) indicate corners."
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "const POSITION_VALUES = new Int8Array([\n  2,  3,  4,  4,  3,  2,\n  3,  6,  8,  8,  6,  3,\n  4,  8, 12, 12,  8,  4,\n  4,  8, 12, 12,  8,  4,\n  3,  6,  8,  8,  6,  3,\n  2,  3,  4,  4,  3,  2\n]);"
      },
      {
        type: "paragraph",
        text: "A major challenge in Quantum Breach is the Injector (X) gate, which has a 50% failure rate on diagonals. Traditional Minimax fails in non-deterministic environments. We solved this using Expected Utility Theory. When evaluating a move involving chance, the branch splits into two outcomes:"
      },
      {
        type: "formula",
        math: "EU(action) = Σ P(outcome_i) × U(outcome_i)"
      },
      {
        type: "formula",
        math: "EU = (0.5 × U_success) + (0.5 × U_fail)"
      },
      {
        type: "paragraph",
        text: "The AI also 'understands' Entropy. In a Winning State, it minimizes variance using Firewalls to lock the board. In a Losing State, it maximizes variance using Viruses to turn Stable enemy nodes into volatile Flux nodes, turning a certain loss into a 50/50 gamble."
      },
      {
        type: "paragraph",
        text: "To achieve 60 FPS while calculating, the architecture uses specific optimizations:"
      },
      {
        type: "list",
        items: [
          "Dedicated Web Worker: All logic runs off the main thread.",
          "TypedArrays: Using Int8Array instead of standard arrays for memory efficiency.",
          "Neighbors Cache: Pre-computed flat array for instant spatial lookups."
        ]
      },
      {
        type: "card",
        title: "PERFORMANCE: TRANSFERABLE OBJECTS",
        content: "We use Transferable Objects to pass memory buffers to the Worker. This means data is moved rather than copied, reducing communication overhead to near zero."
      }
    ]
  },
  {
    id: "multiplayer",
    title: "03 // NETWORK ARCHITECTURE: DETERMINISTIC SYNC",
    color: "text-purple-400",
    blocks: [
      {
        type: "paragraph",
        text: "Multiplayer is implemented via WebSockets (Socket.io). The Node.js server manages matchmaking and rooms, but physical logic is client-side."
      },
      {
        type: "paragraph",
        text: "To sync state without sending the massive board object every frame, we use Input Streaming. Since the game logic is deterministic, if both clients start with the same state and receive the same inputs (plus the same random numbers), the result is identical."
      },
      {
        type: "card",
        title: "RNG SYNCHRONIZATION VIA SEEDS",
        content: "If Player A generates a random number for an attack and wins, Player B must generate the exact same number. To ensure this, the acting client sends a 'seed' with their move. Both clients use a custom PRNG (Mulberry32) seeded with this value."
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "// QuantumLogic.ts\nexport const mulberry32 = (a: number) => {\n  return () => {\n    let t = a += 0x6D2B79F5;\n    t = Math.imul(t ^ (t >>> 15), t | 1);\n    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n  }\n};"
      },
      {
        type: "paragraph",
        text: "Network payloads are minimal to optimize bandwidth:"
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "interface MovePayload {\n  roomId: string;\n  nodeId: number;\n  gate: 'Z' | 'X' | 'H';\n  seed: number;\n}"
      },
      {
        type: "paragraph",
        text: "Although calculation is client-side, the server acts as the Authoritative Source for validation:"
      },
      {
        type: "list",
        items: [
          "Turn Validation: Ensures it is actually the requester's turn.",
          "Rule Validation: Checks if the target cell is empty and gate type is valid.",
          "Rate Limiting: Prevents DoS/Spam attacks."
        ]
      },
      {
        type: "paragraph",
        text: "The system handles disconnections robustly: The server broadcasts 'player_left', the opponent enters a waiting state, and the disconnected client attempts auto-reconnection (up to 5 attempts) before the match is terminated."
      }
    ]
  },
  {
    id: "ar-webxr",
    title: "04 // AUGMENTED REALITY (WebXR)",
    color: "text-yellow-400",
    blocks: [
      {
        type: "paragraph",
        text: "Project Quantum Breach leverages the WebXR standard to deliver an Augmented Reality (AR) experience without requiring native app installation. This implementation utilizes the @react-three/xr library, bridging React Three Fiber with low-level WebXR APIs."
      },
      {
        type: "paragraph",
        text: "The core of the AR experience is the ability to detect physical surfaces (like tables or floors). We use WebXR's Hit-Test capability, where the device constantly casts rays from the camera into the real world to find intersection points with flat surfaces. In the ARPlacement.tsx component, the useXRHitTest hook receives the real-world position matrix every frame:"
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "useXRHitTest((results, getWorldMatrix) => {\n  if (isARPlaced) return; // Stop processing if game is placed\n\n  if (results.length > 0) {\n    // Get the matrix of the detected surface position\n    const hitMatrix = new THREE.Matrix4();\n    getWorldMatrix(hitMatrix, results[0]);\n\n    // Decompose the matrix to extract position and rotation\n    hitMatrix.decompose(\n      reticleRef.current.position,\n      reticleRef.current.quaternion,\n      reticleRef.current.scale\n    );\n  }\n}, 'viewer');"
      },
      {
        type: "paragraph",
        text: "To guide the user, a green reticle is designed to glide over detected surfaces. The placement process is divided into two stages:"
      },
      {
        type: "list",
        items: [
          "Ghost Mode: Before user confirmation, a semi-transparent version of the game board is displayed on the reticle, allowing the user to preview its scale and orientation.",
          "Anchoring: Upon screen tap, the game board's 3D position is 'frozen,' and the reticle disappears. From this point, the game board remains fixed relative to the real world, even if the user moves around the room."
        ]
      },
      {
        type: "card",
        title: "SCALE MANAGEMENT",
        content: "In 3D engines, units are abstract, but in AR, one unit equals one meter. A 6x6 game board rendered at default scale (1) would be 6 meters long! To solve this, the entire game scene is placed within a group with a scale of 0.04, making it approximately 24 cm to fit easily on a coffee table."
      },
      {
        type: "paragraph",
        text: "Technical Challenges and Interactions:"
      },
      {
        type: "list",
        items: [
          "Security Requirements (HTTPS): WebXR functionality only works in secure (HTTPS) contexts. GameSession.tsx includes a check to warn users on HTTP.",
          "Passthrough Rendering: The AR background must be transparent to show the device's camera feed. We manage this using gl={{ alpha: true }} on the Canvas and disabling Fog in the AR scene.",
          "Touch Interaction: Mouse click events don't work in AR. We use standard Pointer Events, translated by React Three Fiber into Raycasting in 3D space, allowing users to move pieces by tapping virtual gates on their mobile screen."
        ]
      }
    ]
  },
  {
    id: "rendering-optimization",
    title: "05 // RENDERING & GRAPHICAL OPTIMIZATION",
    color: "text-red-400",
    blocks: [
      {
        type: "paragraph",
        text: "One of the main priorities for Quantum Breach was high performance. Rendering a 3D scene in a web browser, especially on mobile devices with limited battery and processing power, requires specific techniques."
      },
      {
        type: "paragraph",
        text: "In the background scene (BackgroundScene.tsx) and the game grid lines, there are hundreds of geometric objects. If we created a separate Mesh for each, the number of 'Draw Calls' would drastically increase, bottlenecking the CPU. We used Geometry Instancing with <instancedMesh /> in Three.js, sending all background particles to the GPU with only one Draw Call. Position, rotation, and color changes for each particle are handled by direct matrix manipulation in a shared buffer."
      },
      {
        type: "paragraph",
        text: "In typical React applications, state changes trigger component re-renders. In a game where the state changes 60 times per second, this mechanism is too slow. We use the Zustand library for game state management (gameStore.ts). Its key feature allows state changes without triggering React's render cycle, enabling Three.js components (like useFrame) to directly read instantaneous values from the Store (Transient Updates). This eliminates lags caused by Garbage Collection and React Reconciliation."
      },
      {
        type: "paragraph",
        text: "When AR mode is activated, the system intelligently adjusts graphical settings:"
      },
      {
        type: "list",
        items: [
          "Disabling Anti-Aliasing (AA): On high-pixel-density mobile screens, AA has high overhead with minimal visual difference.",
          "Removing Background and Fog: To allow the real camera view and reduce GPU processing.",
          "Particle Management: The number of floating particles (Sparkles) is halved in AR mode."
        ]
      }
    ]
  },
  {
    id: "conclusion",
    title: "06 // CONCLUSION",
    color: "text-blue-500",
    blocks: [
      {
        type: "paragraph",
        text: "Project Quantum Breach exemplifies the capabilities of the modern web to deliver complex interactive experiences. By combining React for the user interface, Three.js for graphics, and Web Workers for heavy processing, we successfully built a strategic game with high-level AI that runs on a wide range of devices without installation."
      },
      {
        type: "paragraph",
        text: "This project demonstrates that classic computer science algorithms (like Minimax), when combined with cutting-edge web technologies (like WebXR and WebSockets), can create experiences that are both technically profound and visually engaging."
      }
    ]
  }
],
    back: "< TERMINATE SESSION >"
  },
  fa: {
    title: "هسته عصبی",
    subtitle: "تحلیل الگوریتمی // نسخه ۴.۰",
    sections: [
  {
    id: "intro",
    title: "۰۱ // مقدمه و معرفی پروژه",
    color: "text-blue-400",
    blocks: [
      {
        type: "paragraph",
        text: "پروژه Quantum Breach یک بازی استراتژیک نوبتی (Turn-based Strategy) است که با الهام از مفاهیم محاسبات کوانتومی و امنیت سایبری طراحی شده است. این پروژه بر روی پلتفرم وب اجرا می‌شود و هدف آن ارائه یک تجربه گرافیکی سطح بالا (High-end) با استفاده از تکنولوژی‌های مدرن وب است."
      },
      {
        type: "card",
        title: "پشته تکنولوژی (TECH STACK)",
        content: [
          "Frontend Framework: React 19 (مدیریت UI و State)",
          "3D Engine: Three.js + React Three Fiber (رندرینگ سه بعدی)",
          "State Management: Zustand (مدیریت وضعیت سراسری)",
          "Build Tool: Vite (بیلد سریع و HMR)",
          "Styling: Tailwind CSS (استایل‌دهی مدرن UI)",
          "Language: TypeScript (تایپ‌دهی استاتیک برای امنیت کد)",
          "XR/AR: WebXR + React Three XR (واقعیت افزوده)",
          "Backend: Node.js + Express + Socket.io (سرور چندنفره بلادرنگ)"
        ]
      },
      {
        type: "paragraph",
        text: "هسته اصلی بازی بر روی یک شبکه ۶×۶ بنا شده است که بازیکنان (Hacker vs AI/Security) تلاش می‌کنند با استفاده از سه نوع گیت منطقی (Firewall, Injector, Virus) کنترل بیت‌های کوانتومی (Qubits) را در دست بگیرند. چالش فنی اصلی در این پروژه، پیاده‌سازی یک هوش مصنوعی قدرتمند در مرورگر بدون مسدود کردن ترد اصلی (Main Thread) و همچنین ایجاد یک تجربه چندنفره بدون تاخیر با استفاده از همگام‌سازی قطعی بوده است."
      }
    ]
  },
  {
    id: "ai-minimax",
    title: "۰۲ // هسته عصبی: تحلیل مینی‌ماکس",
    color: "text-green-400",
    blocks: [
      {
        type: "paragraph",
        text: "مغز متفکر بازی Quantum Breach یک موتور هوش مصنوعی سفارشی است که بر پایه الگوریتم Minimax همراه با هرس آلفا-بتا (Alpha-Beta Pruning) بنا شده است. برخلاف بسیاری از بازی‌های وب که از منطق‌های ساده \"if-else\" استفاده می‌کنند، این AI درخت بازی را تا عمق مشخصی (بین ۴ تا ۶ لایه بسته به سختی) شبیه‌سازی می‌کند."
      },
      {
        type: "paragraph",
        text: "برای اینکه هوش مصنوعی بتواند بین وضعیت‌های «خوب» و «بد» تمایز قائل شود، از یک تابع ارزیابی (Evaluation Function) قطعی استفاده می‌کند. این تابع به هر وضعیت صفحه (s) یک امتیاز عددی U(s) نسبت می‌دهد:"
      },
      {
        type: "formula",
        math: "U(s) = (W_m · M(s)) + (W_p · P(s)) + (W_c · C(s)) - (W_t · T(s))"
      },
      {
        type: "list",
        items: [
          "M(s) (Material): ارزش خالص مهره‌ها. گیت‌های قفل شده (Locked) به دلیل نفوذناپذیری، ضریب ۳ برابر نسبت به گیت‌های معمولی (Stable) دارند.",
          "P(s) (Positional): ارزش موقعیتی بر اساس Heatmap. خانه‌های مرکزی صفحه ارزش استراتژیک بالاتری دارند زیرا دسترسی به همسایگان بیشتری را فراهم می‌کنند.",
          "C(s) (Clustering): امتیاز خوشه‌بندی. هوش مصنوعی برای ایجاد زنجیره‌ای از مهره‌های متصل به هم پاداش می‌گیرد (دفاع جمعی).",
          "T(s) (Threats): جریمه برای تهدیدات حریف. اگر مهره‌های حریف در موقعیت حمله قرار داشته باشند، امتیاز کسر می‌شود."
        ]
      },
      {
        type: "card",
        title: "پیاده‌سازی HEATMAP",
        content: "آرایه زیر که در کد minimax.worker.ts تعریف شده است، ارزش ذاتی هر خانه از شبکه ۶×۶ را نشان می‌دهد. اعداد بزرگتر (12) نشان‌دهنده مرکز صفحه و اعداد کوچکتر (2) نشان‌دهنده گوشه‌های کم‌ارزش هستند."
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "const POSITION_VALUES = new Int8Array([\n  2,  3,  4,  4,  3,  2,\n  3,  6,  8,  8,  6,  3,\n  4,  8, 12, 12,  8,  4,\n  4,  8, 12, 12,  8,  4,\n  3,  6,  8,  8,  6,  3,\n  2,  3,  4,  4,  3,  2\n]);"
      },
      {
        type: "paragraph",
        text: "یکی از چالش‌های اصلی در Quantum Breach، وجود گیت Injector (X) است که در حملات قطری ۵۰٪ احتمال شکست دارد. الگوریتم Minimax کلاسیک برای بازی‌های قطعی (Deterministic) طراحی شده است. برای حل این مشکل، ما از مفهوم امید ریاضی مطلوبیت (Expected Utility) استفاده کرده‌ایم. هنگامی که هوش مصنوعی حرکتی را بررسی می‌کند که شامل شانس است، شاخه درخت بازی به دو زیرشاخه تقسیم می‌شود:"
      },
      {
        type: "formula",
        math: "EU(action) = Σ P(outcome_i) × U(outcome_i)"
      },
      {
        type: "formula",
        math: "EU = (0.5 × U_success) + (0.5 × U_fail)"
      },
      {
        type: "paragraph",
        text: "هوش مصنوعی دارای یک «فهم» از مکانیک فروپاشی کوانتومی (Quantum Collapse) بازی است. این موضوع در نحوه استفاده از گیت‌های Virus (H) و Firewall (Z) نمود پیدا می‌کند:"
      },
      {
        type: "list",
        items: [
          "استراتژی برد (Winning State): اگر AI جلو باشد، هدفش کاهش واریانس است. او از Firewall استفاده می‌کند تا وضعیت را تثبیت کرده و شانس بازگشت حریف را به صفر برساند.",
          "استراتژی باخت (Losing State): اگر AI عقب باشد، هدفش افزایش واریانس است. او از Virus استفاده می‌کند تا مهره‌های پایدار حریف را به حالت Flux (ناپایدار) ببرد. این کار نتیجه قطعی باخت را به یک قمار ۵۰/۵۰ تبدیل می‌کند."
        ]
      },
      {
        type: "paragraph",
        text: "محاسبات Minimax بسیار سنگین هستند. برای جلوگیری از فریز شدن رابط کاربری (UI) و رسیدن به سرعت ۶۰ فریم بر ثانیه، معماری زیر پیاده‌سازی شده است:"
      },
      {
        type: "list",
        items: [
          "Web Worker اختصاصی: تمام منطق محاسباتی در یک ترد جداگانه اجرا می‌شود.",
          "آرایه‌های نوع‌دار (TypedArrays): به جای استفاده از آرایه‌های معمولی جاوااسکریپت، از Int8Array برای نمایش صفحه بازی استفاده شده است.",
          "کش همسایگان (Neighbors Cache): لیست همسایگان هر سلول (که ثابت است) در شروع بازی پیش‌محاسبه شده و ذخیره می‌شود."
        ]
      },
      {
        type: "card",
        title: "تکنیک TRANSFERABLE OBJECTS",
        content: "هنگام ارسال داده‌ها بین Thread اصلی و Worker، از تکنیک Transferable Objects استفاده شده است. این یعنی بافر حافظه (Buffer) به جای کپی شدن، مستقیماً به Worker منتقل می‌شود که سربار (Overhead) ارتباطی را به نزدیک صفر می‌رساند."
      }
    ]
  },
  {
    id: "multiplayer",
    title: "۰۳ // معماری شبکه: همگام‌سازی قطعی",
    color: "text-purple-400",
    blocks: [
      {
        type: "paragraph",
        text: "بخش چندنفره بازی Quantum Breach بر پایه پروتکل WebSocket (با استفاده از کتابخانه Socket.io) پیاده‌سازی شده است. سرور بازی (نوشته شده با Node.js) وظیفه مدیریت اتاق‌ها (Rooms)، اتصال بازیکنان (Matchmaking) و رله کردن پیام‌ها را بر عهده دارد، اما منطق فیزیک و محاسبات بازی در سمت کلاینت (Client-side) انجام می‌شود."
      },
      {
        type: "paragraph",
        text: "یکی از چالش‌های بازی‌های آنلاین، همگام نگه داشتن وضعیت بازی بین دو بازیکن است. به جای ارسال کل وضعیت صفحه (که شامل ۳۶ آبجکت پیچیده است) در هر فریم، ما از الگوی Input Streaming استفاده کرده‌ایم. در این روش، تنها «ورودی‌های کاربر» و یک «Seed تصادفی» ارسال می‌شود."
      },
      {
        type: "card",
        title: "نقش SEED در همگام‌سازی RNG",
        content: "بازی دارای المان‌های شانسی است. برای حل مشکل Desync، کلاینت شروع‌کننده حرکت، یک seed تصادفی تولید کرده و همراه حرکت ارسال می‌کند. هر دو کلاینت از یک تابع PRNG سفارشی (مانند mulberry32) استفاده می‌کنند که با دریافت این Seed، دنباله‌ای از اعداد تصادفی کاملاً مشابه تولید می‌کند."
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "// QuantumLogic.ts\nexport const mulberry32 = (a: number) => {\n  return () => {\n    let t = a += 0x6D2B79F5;\n    t = Math.imul(t ^ (t >>> 15), t | 1);\n    // ... محاسبات بیتی برای تولید عدد شبه‌تصادفی\n    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;\n  }\n};"
      },
      {
        type: "paragraph",
        text: "برای بهینه‌سازی پهنای باند، پیام‌های تبادل شده بسیار کم‌حجم هستند. یک بسته داده معمولی برای انجام حرکت به شکل زیر است:"
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "interface MovePayload {\n  roomId: string;  // شناسه اتاق بازی\n  nodeId: number;  // ایندکس سلول (0 تا 35)\n  gate: 'Z' | 'X' | 'H'; // نوع گیت استفاده شده\n  seed: number;    // عدد بذر برای همگام‌سازی شانس\n}"
      },
      {
        type: "paragraph",
        text: "اگرچه محاسبات در کلاینت انجام می‌شود، سرور (server/index.js) نقش «حقیقت مرجع» (Authoritative Source) را برای قوانین پایه ایفا می‌کند:"
      },
      {
        type: "list",
        items: [
          "بررسی نوبت (Turn Validation): سرور چک می‌کند که آیا واقعاً نوبت بازیکنی است که درخواست را ارسال کرده یا خیر.",
          "بررسی قوانین حرکت: سرور اطمینان حاصل می‌کند که سلول مقصد خالی است و نوع گیت معتبر است.",
          "محدودیت نرخ (Rate Limiting): برای جلوگیری از حملات Spam یا DoS، سرور تعداد درخواست‌ها در ثانیه را برای هر سوکت محدود می‌کند."
        ]
      },
      {
        type: "paragraph",
        text: "سیستم دارای مکانیزم‌های بازیابی (Reconnection) است. اگر ارتباط یک بازیکن قطع شود:"
      },
      {
        type: "list",
        items: [
          "سرور رویداد player_left را برودکست می‌کند.",
          "کلاینت مقابل وارد حالت «انتظار» شده و UI وضعیت Signal Lost را نمایش می‌دهد.",
          "کلاینت قطع شده به صورت خودکار تلاش می‌کند تا ۵ بار مجدداً متصل شود.",
          "اگر اتصال برقرار نشود، بازی خاتمه می‌یابد."
        ]
      }
    ]
  },
{
    id: "ar-webxr",
    title: "۰۴ // پیاده‌سازی واقعیت افزوده (WebXR)",
    color: "text-yellow-400",
    blocks: [
      {
        type: "paragraph",
        text: "پروژه Quantum Breach از استاندارد WebXR برای ارائه تجربه واقعیت افزوده (AR) بدون نیاز به نصب اپلیکیشن بومی استفاده می‌کند. این پیاده‌سازی با استفاده از کتابخانه @react-three/xr انجام شده است که پلی میان React Three Fiber و APIهای سطح پایین WebXR ایجاد می‌کند."
      },
      {
        type: "paragraph",
        text: "هسته اصلی تجربه AR، قابلیت تشخیص سطوح فیزیکی (مانند میز یا زمین) است. ما از قابلیت Hit-Test در WebXR استفاده می‌کنیم. در کامپوننت ARPlacement.tsx، هوک useXRHitTest ماتریس موقعیت دنیای واقعی را در هر فریم دریافت می‌کند:"
      },
      {
        type: "code",
        language: "TYPESCRIPT",
        code: "useXRHitTest((results, getWorldMatrix) => {\n  if (isARPlaced) return; // اگر بازی شروع شده، پردازش متوقف شود\n\n  if (results.length > 0) {\n    // دریافت ماتریس موقعیت سطح تشخیص داده شده\n    const hitMatrix = new THREE.Matrix4();\n    getWorldMatrix(hitMatrix, results[0]);\n\n    // تجزیه ماتریس برای استخراج موقعیت و چرخش\n    hitMatrix.decompose(\n      reticleRef.current.position,\n      reticleRef.current.quaternion,\n      reticleRef.current.scale\n    );\n  }\n}, 'viewer');"
      },
      {
        type: "paragraph",
        text: "برای راهنمایی کاربر، یک حلقه سبز رنگ (Reticle) طراحی شده که روی سطوح تشخیص داده شده می‌لغزد. فرآیند جایگذاری به دو مرحله تقسیم می‌شود:"
      },
      {
        type: "list",
        items: [
          "حالت شبح (Ghost Mode): قبل از تایید کاربر، یک نسخه نیمه‌شفاف از صفحه بازی روی رتیکل نمایش داده می‌شود تا کاربر مقیاس و جهت آن را ببیند.",
          "قفل شدن (Anchoring): با لمس صفحه (Tap)، موقعیت صفحه بازی در فضای سه بعدی «قفل» (Freeze) می‌شود و رتیکل ناپدید می‌گردد. از این لحظه به بعد، صفحه بازی نسبت به دنیای واقعی ثابت می‌ماند."
        ]
      },
      {
        type: "card",
        title: "مدیریت مقیاس (SCALE MANAGEMENT)",
        content: "در موتورهای سه بعدی، واحدها انتزاعی هستند، اما در AR هر واحد معادل یک متر است. صفحه بازی ۶×۶ اگر با مقیاس پیش‌فرض (۱) رندر شود، ۶ متر طول خواهد داشت! برای حل این مشکل، کل صحنه بازی درون یک گروه با مقیاس 0.04 قرار گرفته است تا اندازه آن حدود ۲۴ سانتی‌متر شود و به راحتی روی یک میز قهوه‌خوری جا بگیرد."
      },
      {
        type: "paragraph",
        text: "چالش‌های فنی و تعاملات:"
      },
      {
        type: "list",
        items: [
          "الزامات امنیتی (HTTPS): طبق استاندارد W3C، قابلیت WebXR تنها در محیط‌های امن (HTTPS) کار می‌کند. در GameSession.tsx یک چک امنیتی قرار داده شده تا اگر کاربر روی HTTP باشد، هشدار دریافت کند.",
          "رندرینگ Passthrough: پس‌زمینه در حالت AR باید شفاف (Transparent) باشد. ما با استفاده از پراپ gl={{ alpha: true }} در Canvas و غیرفعال کردن Fog در صحنه AR، این موضوع را مدیریت کرده‌ایم.",
          "تعامل لمسی: رویدادهای کلیک ماوس در AR کار نمی‌کنند. ما از رویدادهای استاندارد Pointer Events استفاده کرده‌ایم که توسط React Three Fiber به Raycasting ترجمه می‌شوند تا کاربر بتواند با لمس کردن گیت‌های مجازی روی صفحه موبایل، مهره‌ها را جابجا کند."
        ]
      }
    ]
  },
  {
    id: "rendering-optimization",
    title: "۰۵ // رندرینگ و بهینه‌سازی گرافیکی",
    color: "text-red-400",
    blocks: [
      {
        type: "paragraph",
        text: "یکی از اولویت‌های اصلی پروژه Quantum Breach، عملکرد بالا (Performance) بوده است. رندر کردن یک صحنه سه بعدی در مرورگر وب، به‌ویژه در دستگاه‌های موبایل با محدودیت باتری و پردازشگر، نیازمند تکنیک‌های خاصی است."
      },
      {
        type: "paragraph",
        text: "در صحنه پس‌زمینه (BackgroundScene.tsx) و خطوط شبکه بازی، صدها آبجکت هندسی وجود دارد. ما از تکنیک Geometry Instancing استفاده کرده‌ایم. با استفاده از <instancedMesh /> در Three.js، تمام ذرات پس‌زمینه تنها با یک Draw Call به GPU ارسال می‌شوند. تغییرات موقعیت، چرخش و رنگ هر ذره از طریق دستکاری مستقیم ماتریس‌ها در یک بافر اشتراکی انجام می‌شود."
      },
      {
        type: "paragraph",
        text: "در برنامه‌های React معمولی، تغییر State باعث رندر مجدد می‌شود. ما از کتابخانه Zustand برای مدیریت وضعیت بازی (gameStore.ts) استفاده کرده‌ایم. ویژگی کلیدی آن این است که اجازه می‌دهد تغییرات را بدون تحریک چرخه رندر React انجام دهیم و کامپوننت‌های Three.js (مانند useFrame) می‌توانند مستقیماً مقدار لحظه‌ای را از Store بخوانند (Transient Updates)."
      },
      {
        type: "paragraph",
        text: "هنگامی که حالت AR فعال می‌شود، سیستم به طور هوشمند تنظیمات گرافیکی را تغییر می‌دهد:"
      },
      {
        type: "list",
        items: [
          "غیرفعال کردن Anti-Aliasing (AA): در صفحات موبایل با تراکم پیکسلی بالا، AA سربار زیادی دارد و تفاوت بصری کمی ایجاد می‌کند.",
          "حذف پس‌زمینه و مه (Fog): برای اینکه دوربین واقعی دیده شود و پردازش GPU کاهش یابد.",
          "مدیریت ذرات: تعداد ذرات معلق (Sparkles) در حالت AR به نصف کاهش می‌یابد."
        ]
      }
    ]
  },
  {
    id: "conclusion",
    title: "۰۶ // نتیجه‌گیری",
    color: "text-blue-500",
    blocks: [
      {
        type: "paragraph",
        text: "پروژه Quantum Breach نمونه‌ای از توانایی‌های مدرن وب برای ارائه تجربیات تعاملی پیچیده است. با ترکیب React برای رابط کاربری، Three.js برای گرافیک و Web Workers برای پردازش‌های سنگین، ما موفق شدیم یک بازی استراتژیک با هوش مصنوعی سطح بالا بسازیم که بدون نیاز به نصب، روی طیف وسیعی از دستگاه‌ها اجرا می‌شود."
      },
      {
        type: "paragraph",
        text: "این پروژه نشان می‌دهد که الگوریتم‌های کلاسیک علوم کامپیوتر (مانند Minimax) وقتی با تکنولوژی‌های نوین وب (مانند WebXR و WebSockets) ترکیب شوند، می‌توانند تجربیاتی خلق کنند که هم از نظر فنی عمیق و هم از نظر بصری جذاب هستند."
      }
    ]
  }
],
    back: "< پایان جلسه >"
  }
};

const MinimaxInfo = () => {
  const [lang, setLang] = useState<Lang>('en');

  // Helper function to render specific block types
  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={index} className="text-sm md:text-base leading-relaxed text-gray-300 whitespace-pre-line mb-4">
            {block.text}
          </p>
        );

      case 'code':
        return (
          <div key={index} className="my-6 rounded bg-black/50 border border-white/10 p-4 overflow-hidden font-mono text-xs md:text-sm shadow-inner relative group">
            {block.language && (
              <div className="absolute top-0 right-0 px-2 py-1 bg-white/10 text-[10px] text-gray-400 uppercase tracking-wider rounded-bl">
                {block.language}
              </div>
            )}
            <pre className="overflow-x-auto custom-scrollbar text-green-400/90 leading-normal" dir="ltr">
              <code>{block.code}</code>
            </pre>
          </div>
        );

      case 'formula':
        return (
          <div key={index} className="my-6 py-4 px-2 flex justify-center items-center bg-white/5 border-y border-white/5" dir="ltr">
            <span className="font-serif italic text-lg md:text-xl text-purple-200 tracking-wide text-center">
              {block.math}
            </span>
          </div>
        );

      case 'list':
        return (
          <ul key={index} className="space-y-2 mb-6 pl-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm md:text-base text-gray-300">
                <span className="mt-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );

      case 'card':
        return (
          <div key={index} className="my-6 p-4 md:p-5 border-l-2 border-purple-500 bg-gradient-to-r from-purple-900/20 to-transparent rounded-r-sm">
            <h4 className="text-purple-300 font-bold tracking-wider text-xs md:text-sm mb-2 uppercase">
              {block.title}
            </h4>
            {Array.isArray(block.content) ? (
              <ul className="space-y-1">
                {block.content.map((c, i) => (
                  <li key={i} className="text-xs md:text-sm text-gray-400 flex gap-2">
                    <span className="opacity-50">-</span> {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                {block.content}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center overflow-hidden">
      
      {/* 1. GLASS HEADER */}
      <div className="z-20 w-full p-4 md:p-6 flex justify-between items-center border-b border-white/10 bg-black/20 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {CONTENT[lang].title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] md:text-xs text-purple-300 tracking-[0.2em]">
              {CONTENT[lang].subtitle}
            </p>
          </div>
        </div>

        {/* TERMINAL TOGGLE */}
        <div className="flex bg-black/40 rounded border border-gray-700">
          <button 
            onClick={() => setLang('en')}
            className={clsx("px-3 py-1 text-xs font-bold transition-all", lang === 'en' ? "bg-purple-600 text-white" : "text-gray-500 hover:text-white")}
          >
            EN
          </button>
          <div className="w-px bg-gray-700"></div>
          <button 
            onClick={() => setLang('fa')}
            className={clsx("px-3 py-1 text-xs font-bold transition-all font-sans", lang === 'fa' ? "bg-purple-600 text-white" : "text-gray-500 hover:text-white")}
          >
            FA
          </button>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="z-10 w-full max-w-4xl flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 touch-pan-y">
        <AnimatePresence mode='wait'>
          <motion.div
            key={lang}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
            className={clsx("space-y-10", lang === 'fa' ? 'font-sans' : 'font-mono')}
          >
            
            {CONTENT[lang].sections.map((section) => (
              <div key={section.id} className="relative group">
                {/* Decorative Brackets */}
                <div className="absolute -left-2 -top-2 w-4 h-4 border-l-2 border-t-2 border-gray-700 group-hover:border-purple-500 transition-colors"></div>
                <div className="absolute -right-2 -top-2 w-4 h-4 border-r-2 border-t-2 border-gray-700 group-hover:border-purple-500 transition-colors"></div>

                {/* Glass Panel */}
                <div className="bg-black/30 border border-white/10 backdrop-blur-sm p-6 md:p-8 rounded-sm hover:border-purple-500/30 transition-all">
                    
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <div className={`w-1 h-6 ${section.color} bg-current shadow-[0_0_10px_currentColor]`}></div>
                        <h2 className={`text-xl md:text-2xl font-black tracking-widest text-white uppercase`}>
                            {section.title}
                        </h2>
                    </div>

                    {/* Dynamic Block Rendering */}
                    <div className="pl-1">
                      {section.blocks.map((block, idx) => renderBlock(block, idx))}
                    </div>

                    {/* Footer Data */}
                    {section.footer && (
                      <div className="mt-8 pt-4 border-t border-gray-800 text-[10px] font-bold text-gray-600 tracking-widest flex items-center justify-end gap-2">
                        {section.footer}
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {/* Empty State Fallback (remove this when data is injected if not needed) */}
            {CONTENT[lang].sections.length === 0 && (
              <div className="text-center py-20 text-gray-500 animate-pulse">
                AWAITING DATA INJECTION...
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. FOOTER */}
      <div className="fixed bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-30 flex justify-center shrink-0">
        <Link to="/">
          <button className="group relative px-12 py-4 bg-black/40 border border-purple-500/50 text-purple-400 font-black tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all text-xs md:text-sm overflow-hidden backdrop-blur-md">
            <span className="relative z-10">{CONTENT[lang].back}</span>
            <div className="absolute inset-0 bg-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
          </button>
        </Link>
      </div>

    </div>
  );
};

export default MinimaxInfo;