// src/pages/GameGuide.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

type Lang = 'en' | 'fa';

// --- DATA CONTENT (Unchanged) ---
const CONTENT = {
  en: {
    title: "BREACH PROTOCOL",
    subtitle: "HACKER'S MANUAL // V.1.0",
    sections: [
      {
        id: "mission",
        title: "THE MISSION",
        color: "white",
        body: "You are attempting to breach a Quantum Core protected by an advanced AI. The goal is simple: You must occupy more bits than the AI when the system collapses.",
        footer: "Blue = Hacker (You) | Red = AI Security"
      },
      {
        id: "arsenal",
        title: "YOUR TOOLS",
        color: "#00f3ff",
        body: "You have 3 programs to upload. Drag and drop them onto the grid.",
        cards: [
          { 
            name: "INJECTOR (X)", 
            role: "ATTACK", 
            desc: "Captures a node and attacks neighbors (Up/Down/Left/Right).", 
            note: "Risk: 50% fail rate on diagonals.",
            color: "text-neon-green",
            border: "border-neon-green",
            bg: "bg-neon-green/10"
          },
          { 
            name: "FIREWALL (Z)", 
            role: "DEFEND", 
            desc: "Permanently LOCKS a node. It cannot be stolen or changed.", 
            note: "Use to secure key territory.",
            color: "text-neon-blue",
            border: "border-neon-blue",
            bg: "bg-neon-blue/10"
          },
          { 
            name: "VIRUS (H)", 
            role: "CHAOS", 
            desc: "Destabilizes a node into FLUX. It spreads chaos to all 8 neighbors.", 
            note: "High risk, high reward.",
            color: "text-neon-pink",
            border: "border-neon-pink",
            bg: "bg-neon-pink/10"
          }
        ]
      },
      {
        id: "entropy",
        title: "SYSTEM ENTROPY",
        color: "#aa00ff",
        body: "Every move increases System Instability. When the grid is full, the Core Collapses. All 'Virus' (Flux) nodes will instantly resolve to either YOU or the AI based on probability."
      },
      {
        id: "outcomes",
        title: "FINAL OUTCOMES",
        color: "gray",
        body: "When the dust settles, the score is calculated:",
        states: [
          { label: "VICTORY", text: "SYSTEM OVERRIDDEN. ACCESS GRANTED.", color: "text-neon-blue" },
          { label: "DEFEAT", text: "INTRUSION DETECTED. NEURAL LINK SEVERED.", color: "text-neon-pink" },
          { label: "DRAW (EQUAL)", text: "⚠ CRITICAL FAILURE. CORE MELTDOWN IMMINENT. EVACUATE IMMEDIATELY.", color: "text-yellow-400" }
        ]
      }
    ],
    back: "INITIATE UPLINK"
  },
  fa: {
title: "پروتکل نفوذ",
subtitle: "راهنمای هکر // نسخه ۱.۰",
sections: [
{
id: "mission",
title: "ماموریت",
color: "white",
body: "شما در حال تلاش برای نفوذ به یک هسته کوانتومی هستید که توسط هوش مصنوعی پیشرفته محافظت می‌شود. هدف ساده است: باید هنگام فروپاشی کردن سیستم، بیت های بیشتری نسبت به هوش مصنوعی اشغال کرده باشید.",
footer: "آبی = هکر (شما) | قرمز = امنیت هوش مصنوعی"
},
{
id: "arsenal",
title: "ابزار های شما",
color: "#00f3ff",
body: "شما ۳ برنامه برای آپلود در اختیار دارید. آن‌ها را بکشید و روی شبکه رها کنید.",
cards: [
{
name: "تزریق‌گر (X)",
role: "هجومی",
desc: "یک خانه را تسخیر کرده و به همسایگان (بالا/پایین/چپ/راست) حمله می‌کند.",
note: "ریسک: ۵۰٪ احتمال شکست در خانه‌های قطری.",
color: "text-neon-green",
border: "border-neon-green",
bg: "bg-neon-green/10"
},
{
name: "فایروال (Z)",
role: "دفاعی",
desc: "یک خانه را برای همیشه قفل می‌کند. این خانه قابل دزدیدن یا تغییر نیست.",
note: "برای حفظ قلمروهای کلیدی استفاده کنید.",
color: "text-neon-blue",
border: "border-neon-blue",
bg: "bg-neon-blue/10"
},
{
name: "ویروس (H)",
role: "آشوب",
desc: "خانه را به حالت ناپایدار (FLUX) می‌برد. آشوب را به تمام ۸ همسایه اطراف پخش می‌کند.",
note: "ریسک بالا، پاداش بالا.",
color: "text-neon-pink",
border: "border-neon-pink",
bg: "bg-neon-pink/10"
}
]
},
{
id: "entropy",
title: "آنتروپی سیستم",
color: "#aa00ff",
body: "هر حرکت باعث افزایش ناپایداری سیستم می‌شود. وقتی شبکه پر شود، هسته فرو می‌ریزد. تمام خانه‌های «ویروسی» (ناپایدار) فوراً بر اساس احتمالات، یا به نفع شما و یا هوش مصنوعی تثبیت می‌شوند."
},
{
id: "outcomes",
title: "نتایج نهایی",
color: "gray",
body: "پس از پایان عملیات، امتیاز نهایی محاسبه می‌شود:",
states: [
{ label: "پیروزی", text: "سیستم بازنویسی شد. دسترسی مجاز است.", color: "text-neon-blue" },
{ label: "شکسـت", text: "نفوذ شناسایی شد. پیوند عصبی قطع گردید.", color: "text-neon-pink" },
{ label: "تساوی", text: "⚠ خطای بحرانی. ذوب هسته قریب‌الوقوع است. فوراً تخلیه کنید.", color: "text-yellow-400" }
]
}
],
back: "آغاز عملیات"
}
};

const GameGuide = () => {
  const [lang, setLang] = useState<Lang>('en');

  // Removed local background & visibility logic (Handled by App.tsx)

  return (
    // Height fixed to viewport, no background logic needed here
    <div className="relative w-full h-[100dvh] flex flex-col items-center overflow-hidden">
      
      {/* 2. GLASS HEADER */}
      <div className="z-20 w-full p-4 md:p-6 flex justify-between items-center border-b border-white/10 bg-black/20 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {CONTENT[lang].title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
            <p className="text-[10px] md:text-xs text-neon-blue tracking-[0.2em]">
              {CONTENT[lang].subtitle}
            </p>
          </div>
        </div>

        {/* TERMINAL TOGGLE */}
        <div className="flex bg-black/40 rounded border border-gray-700">
          <button 
            onClick={() => setLang('en')}
            className={clsx("px-3 py-1 text-xs font-bold transition-all", lang === 'en' ? "bg-neon-blue text-black" : "text-gray-500 hover:text-white")}
          >
            EN
          </button>
          <div className="w-px bg-gray-700"></div>
          <button 
            onClick={() => setLang('fa')}
            className={clsx("px-3 py-1 text-xs font-bold transition-all font-sans", lang === 'fa' ? "bg-neon-blue text-black" : "text-gray-500 hover:text-white")}
          >
            FA
          </button>
        </div>
      </div>

      {/* 3. SCROLLABLE CONTENT AREA */}
      <div className="z-10 w-full max-w-4xl flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 touch-pan-y">
        <AnimatePresence mode='wait'>
          <motion.div
            key={lang}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
            className={clsx("space-y-8", lang === 'fa' ? 'font-sans' : 'font-mono')}
          >
            
            {CONTENT[lang].sections.map((section) => (
              <div key={section.id} className="relative group">
                {/* Decorative Brackets (Theme Consistency) */}
                <div className="absolute -left-2 -top-2 w-4 h-4 border-l-2 border-t-2 border-gray-700 group-hover:border-neon-blue transition-colors"></div>
                <div className="absolute -right-2 -top-2 w-4 h-4 border-r-2 border-t-2 border-gray-700 group-hover:border-neon-blue transition-colors"></div>

                {/* Glass Panel */}
                <div className="bg-black/30 border border-white/10 backdrop-blur-sm p-6 md:p-8 rounded-sm hover:border-white/20 transition-all">
                    
                    {/* Header */}
                    <h2 className={`text-xl font-black mb-4 tracking-widest ${section.color}`}>
                        {section.title}
                    </h2>

                    {/* Body */}
                    <p className="text-sm md:text-base leading-relaxed text-gray-300 whitespace-pre-line border-l-2 border-gray-800 pl-4">
                        {section.body}
                    </p>

                    {/* Footer Data */}
                    {section.footer && (
                      <div className="mt-4 pt-4 border-t border-gray-800 text-xs font-bold text-gray-500">
                        {`>> ${section.footer}`}
                      </div>
                    )}

                    {/* ARSENAL CARDS (Holographic Look) */}
                    {section.cards && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {section.cards.map((card, i) => (
                          <div key={i} className={`relative border ${card.border} ${card.bg} p-4 transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,0,0,0.5)] rounded-lg backdrop-blur-md`}>
                             {/* Card Scanline */}
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 pointer-events-none transition-opacity"></div>
                             
                             <div className={`text-[10px] font-black tracking-widest mb-1 ${card.color}`}>{card.role}</div>
                             <div className="text-base font-bold text-white mb-2">{card.name}</div>
                             <div className="text-xs text-gray-300 leading-snug mb-3 opacity-80">{card.desc}</div>
                             <div className="text-[9px] text-white/50 border-t border-white/10 pt-2 font-bold">
                               {`// ${card.note}`}
                             </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* OUTCOMES LIST */}
                    {section.states && (
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        {section.states.map((state, i) => (
                           <div key={i} className={`flex items-center gap-4 p-3 bg-black/40 border-l-4 ${state.color}`}>
                              <span className={`font-black text-xs min-w-[60px]`}>{state.label}</span>
                              <span className="text-xs text-gray-400 font-bold">{state.text}</span>
                           </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. FOOTER */}
      <div className="fixed bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-30 flex justify-center shrink-0">
        <Link to="/">
          <button className="group relative px-12 py-4 bg-black/40 border border-neon-blue/50 text-neon-blue font-black tracking-[0.2em] hover:bg-neon-blue hover:text-black transition-all text-xs md:text-sm overflow-hidden backdrop-blur-md">
            <span className="relative z-10">{CONTENT[lang].back}</span>
            <div className="absolute inset-0 bg-neon-blue translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-0"></div>
          </button>
        </Link>
      </div>

    </div>
  );
};

export default GameGuide;