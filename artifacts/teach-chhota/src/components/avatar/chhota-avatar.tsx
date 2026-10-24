import React from "react";

export interface ChhotaAvatarProps {
  stage?: number; // 0 to 7
  size?: number; // width/height in px
  accessories?: string[]; // IDs of equipped accessories
  emotion?: "happy" | "thinking" | "curious" | "celebrate" | "idle";
  className?: string;
  showStageBadge?: boolean;
}

export const STAGE_DATA = [
  { name: "Beej", hindi: "बीज", english: "Seedling", minScore: 0, color: "#8d6e63" },
  { name: "Ankuran", hindi: "अंकुरण", english: "Sprout", minScore: 100, color: "#66bb6a" },
  { name: "Paudha", hindi: "पौधा", english: "Little Sapling", minScore: 250, color: "#43a047" },
  { name: "Kishor", hindi: "किशोर तरु", english: "Young Tree", minScore: 500, color: "#2e7d32" },
  { name: "Taru", hindi: "तरु", english: "Flourishing Tree", minScore: 1000, color: "#285d5c" },
  { name: "Vriksh", hindi: "वृक्ष", english: "Mighty Tree", minScore: 2000, color: "#1b5e20" },
  { name: "Kalpavriksh", hindi: "कल्पवृक्ष", english: "Wish Tree", minScore: 3500, color: "#f3bd62" },
  { name: "Guru", hindi: "गुरु वृक्ष", english: "Ancient Banyan Sage", minScore: 5000, color: "#e47451" },
];

export function ChhotaAvatar({
  stage = 0,
  size = 120,
  accessories = [],
  emotion = "idle",
  className = "",
  showStageBadge = false,
}: ChhotaAvatarProps) {
  const currentStage = Math.max(0, Math.min(7, stage));
  const stageInfo = STAGE_DATA[currentStage];

  // Helper check for equipped cosmetics
  const has = (id: string) => accessories.includes(id);

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Golden Aura / Rainbow Trail background */}
      {has("skin-golden") && (
        <div
          className="absolute inset-0 rounded-full animate-pulse filter blur-md"
          style={{
            background: "radial-gradient(circle, rgba(247,214,108,0.7) 0%, rgba(243,189,98,0) 70%)",
            transform: "scale(1.3)",
          }}
        />
      )}
      {has("skin-rainbow") && (
        <div
          className="absolute inset-0 rounded-full animate-spin filter blur-sm"
          style={{
            background: "conic-gradient(from 0deg, #e47451, #f3bd62, #5caaa0, #6c5b7b, #e47451)",
            opacity: 0.5,
            animationDuration: "6s",
            transform: "scale(1.25)",
          }}
        />
      )}

      {/* SVG Canvas for Chhota */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="transition-transform duration-300 hover:scale-105"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d97736" />
            <stop offset="100%" stopColor="#9c4118" />
          </linearGradient>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8d6e63" />
            <stop offset="100%" stopColor="#5d4037" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#81c784" />
            <stop offset="100%" stopColor="#2e7d32" />
          </linearGradient>
          <linearGradient id="goldenGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="50%" stopColor="#f3bd62" />
            <stop offset="100%" stopColor="#e47451" />
          </linearGradient>
        </defs>

        {/* ─── BASE / STAGE SPECIFIC BODY ─── */}

        {/* Stage 0: Beej (Seedling in Clay Pot) */}
        {currentStage === 0 && (
          <g id="stage-beej">
            {/* Clay Handi/Pot */}
            <path d="M 60 140 L 70 185 Q 100 195 130 185 L 140 140 Z" fill="url(#potGrad)" stroke="#78350f" strokeWidth="3" />
            <ellipse cx="100" cy="140" rx="42" ry="10" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            <ellipse cx="100" cy="140" rx="36" ry="7" fill="#451a03" />

            {/* Seed Body */}
            <circle cx="100" cy="122" r="22" fill="#a16207" stroke="#713f12" strokeWidth="2.5" />

            {/* Little green shoot on top */}
            <path d="M 100 102 Q 95 85 85 80 Q 95 82 100 95 Q 105 82 115 80 Q 105 85 100 102 Z" fill="#4ade80" stroke="#16a34a" strokeWidth="2" />

            {/* Face */}
            <circle cx="93" cy="120" r="3" fill="#1e293b" />
            <circle cx="107" cy="120" r="3" fill="#1e293b" />
            <ellipse cx="90" cy="125" rx="3" ry="1.5" fill="#fca5a5" opacity="0.8" />
            <ellipse cx="110" cy="125" rx="3" ry="1.5" fill="#fca5a5" opacity="0.8" />
            <path d="M 96 128 Q 100 133 104 128" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 1: Ankuran (Sprout) */}
        {currentStage === 1 && (
          <g id="stage-ankuran">
            {/* Clay Pot */}
            <path d="M 65 145 L 75 185 Q 100 193 125 185 L 135 145 Z" fill="url(#potGrad)" stroke="#78350f" strokeWidth="3" />
            <ellipse cx="100" cy="145" rx="38" ry="8" fill="#451a03" />

            {/* Curving Stem */}
            <path d="M 100 145 Q 98 115 100 90" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />

            {/* Sprout Head */}
            <circle cx="100" cy="85" r="28" fill="#4ade80" stroke="#16a34a" strokeWidth="3" />

            {/* Two leaves fluttering from head */}
            <path d="M 85 70 Q 60 55 55 75 Q 75 75 85 72 Z" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
            <path d="M 115 70 Q 140 55 145 75 Q 125 75 115 72 Z" fill="#22c55e" stroke="#15803d" strokeWidth="2" />

            {/* Curious Big Eyes */}
            <circle cx="92" cy="83" r="5" fill="#0f172a" />
            <circle cx="108" cy="83" r="5" fill="#0f172a" />
            <circle cx="90" cy="81" r="1.5" fill="#ffffff" />
            <circle cx="106" cy="81" r="1.5" fill="#ffffff" />
            <ellipse cx="86" cy="89" rx="4" ry="2" fill="#fb7185" opacity="0.7" />
            <ellipse cx="114" cy="89" rx="4" ry="2" fill="#fb7185" opacity="0.7" />
            <path d="M 95 91 Q 100 97 105 91" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 2: Paudha (Sapling with vibrant leaves) */}
        {currentStage === 2 && (
          <g id="stage-paudha">
            {/* Pot */}
            <path d="M 68 152 L 76 186 Q 100 193 124 186 L 132 152 Z" fill="url(#potGrad)" stroke="#78350f" strokeWidth="2.5" />
            <ellipse cx="100" cy="152" rx="34" ry="7" fill="#451a03" />

            {/* Sturdy Stem with branches */}
            <path d="M 100 152 L 100 95" stroke="#78350f" strokeWidth="10" strokeLinecap="round" />
            <path d="M 100 125 Q 75 115 65 105" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
            <path d="M 100 115 Q 125 105 135 95" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />

            {/* Branch leaf bunches */}
            <circle cx="62" cy="102" r="14" fill="#22c55e" />
            <circle cx="138" cy="92" r="14" fill="#22c55e" />

            {/* Main Head Foliage */}
            <circle cx="100" cy="70" r="34" fill="#4ade80" stroke="#16a34a" strokeWidth="3" />
            <circle cx="78" cy="58" r="18" fill="#22c55e" opacity="0.9" />
            <circle cx="122" cy="58" r="18" fill="#22c55e" opacity="0.9" />

            {/* Friendly Smiling Face */}
            <circle cx="91" cy="70" r="5" fill="#0f172a" />
            <circle cx="109" cy="70" r="5" fill="#0f172a" />
            <circle cx="93" cy="68" r="1.5" fill="#ffffff" />
            <circle cx="111" cy="68" r="1.5" fill="#ffffff" />
            <ellipse cx="84" cy="76" rx="4" ry="2" fill="#fb7185" opacity="0.8" />
            <ellipse cx="116" cy="76" rx="4" ry="2" fill="#fb7185" opacity="0.8" />
            <path d="M 94 77 Q 100 84 106 77" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 3: Kishor (Young Tree) */}
        {currentStage === 3 && (
          <g id="stage-kishor">
            {/* Trunk rooted in green mound */}
            <ellipse cx="100" cy="180" rx="55" ry="12" fill="#15803d" />
            <path d="M 92 180 Q 94 135 90 95 L 110 95 Q 106 135 108 180 Z" fill="url(#trunkGrad)" />

            {/* Foliage Clusters */}
            <circle cx="100" cy="70" r="45" fill="#16a34a" />
            <circle cx="65" cy="78" r="26" fill="#22c55e" />
            <circle cx="135" cy="78" r="26" fill="#22c55e" />
            <circle cx="100" cy="45" r="28" fill="#4ade80" />

            {/* Character Face on Main Canopy */}
            <circle cx="90" cy="72" r="5.5" fill="#0f172a" />
            <circle cx="110" cy="72" r="5.5" fill="#0f172a" />
            <circle cx="92" cy="70" r="2" fill="#ffffff" />
            <circle cx="112" cy="70" r="2" fill="#ffffff" />
            <ellipse cx="82" cy="79" rx="5" ry="2.5" fill="#fb7185" opacity="0.8" />
            <ellipse cx="118" cy="79" rx="5" ry="2.5" fill="#fb7185" opacity="0.8" />
            <path d="M 94 80 Q 100 87 106 80" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 4: Taru (Flourishing Tree) */}
        {currentStage === 4 && (
          <g id="stage-taru">
            <ellipse cx="100" cy="182" rx="65" ry="14" fill="#285d5c" />
            {/* Mighty Trunk */}
            <path d="M 86 182 Q 92 125 84 80 L 116 80 Q 108 125 114 182 Z" fill="url(#trunkGrad)" stroke="#3e2723" strokeWidth="2" />

            {/* Broad Canopy */}
            <ellipse cx="100" cy="65" rx="58" ry="42" fill="#285d5c" />
            <circle cx="55" cy="70" r="30" fill="#3a7b7a" />
            <circle cx="145" cy="70" r="30" fill="#3a7b7a" />
            <circle cx="100" cy="38" r="34" fill="#5caaa0" />

            {/* Wise Kind Face */}
            <circle cx="90" cy="66" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <circle cx="110" cy="66" r="6" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <circle cx="91" cy="66" r="3" fill="#0f172a" />
            <circle cx="111" cy="66" r="3" fill="#0f172a" />
            <path d="M 93 76 Q 100 83 107 76" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 5: Vriksh (Mighty Tree with fruits & birds) */}
        {currentStage === 5 && (
          <g id="stage-vriksh">
            <ellipse cx="100" cy="184" rx="72" ry="14" fill="#1b5e20" />
            <path d="M 82 184 Q 90 120 78 75 L 122 75 Q 110 120 118 184 Z" fill="url(#trunkGrad)" stroke="#3e2723" strokeWidth="2.5" />

            {/* Grand Foliage */}
            <ellipse cx="100" cy="62" rx="68" ry="48" fill="#1b5e20" />
            <circle cx="48" cy="68" r="34" fill="#2e7d32" />
            <circle cx="152" cy="68" r="34" fill="#2e7d32" />
            <circle cx="100" cy="30" r="38" fill="#43a047" />

            {/* Golden Mango / Fruit Sparkles */}
            <circle cx="55" cy="85" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <circle cx="145" cy="85" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <circle cx="100" cy="20" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />

            {/* Friendly Bird perched on left branch */}
            <ellipse cx="40" cy="50" rx="7" ry="5" fill="#0284c7" />
            <circle cx="45" cy="47" r="3.5" fill="#0284c7" />
            <polygon points="48,47 52,48 48,50" fill="#f59e0b" />

            {/* Character Face */}
            <circle cx="90" cy="64" r="6" fill="#0f172a" />
            <circle cx="110" cy="64" r="6" fill="#0f172a" />
            <circle cx="92" cy="62" r="2" fill="#ffffff" />
            <circle cx="112" cy="62" r="2" fill="#ffffff" />
            <ellipse cx="80" cy="72" rx="5" ry="2.5" fill="#fca5a5" />
            <ellipse cx="120" cy="72" rx="5" ry="2.5" fill="#fca5a5" />
            <path d="M 94 74 Q 100 81 106 74" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 6: Kalpavriksh (Wish Tree with Golden Leaves) */}
        {currentStage === 6 && (
          <g id="stage-kalpavriksh">
            {/* Celestial Mound */}
            <ellipse cx="100" cy="184" rx="75" ry="14" fill="#d97706" opacity="0.4" />
            <ellipse cx="100" cy="184" rx="65" ry="10" fill="#78350f" />

            {/* Golden Carved Trunk */}
            <path d="M 80 184 Q 90 115 75 70 L 125 70 Q 110 115 120 184 Z" fill="url(#goldenGrad)" stroke="#b45309" strokeWidth="2.5" />

            {/* Shimmering Golden Canopy */}
            <ellipse cx="100" cy="60" rx="74" ry="52" fill="url(#goldenGrad)" stroke="#f59e0b" strokeWidth="3" />
            <circle cx="45" cy="65" r="36" fill="#fef08a" stroke="#eab308" strokeWidth="2" opacity="0.9" />
            <circle cx="155" cy="65" r="36" fill="#fef08a" stroke="#eab308" strokeWidth="2" opacity="0.9" />
            <circle cx="100" cy="25" r="40" fill="#fde047" stroke="#eab308" strokeWidth="2" />

            {/* Gemstones / Pearls hanging */}
            <circle cx="50" cy="98" r="4" fill="#38bdf8" />
            <circle cx="80" cy="108" r="4" fill="#ec4899" />
            <circle cx="120" cy="108" r="4" fill="#a855f7" />
            <circle cx="150" cy="98" r="4" fill="#22c55e" />

            {/* Regal Radiant Face */}
            <circle cx="89" cy="60" r="6" fill="#78350f" />
            <circle cx="111" cy="60" r="6" fill="#78350f" />
            <circle cx="91" cy="58" r="2" fill="#ffffff" />
            <circle cx="113" cy="58" r="2" fill="#ffffff" />
            <path d="M 94 70 Q 100 77 106 70" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* Stage 7: Guru (Ancient Banyan Sage) */}
        {currentStage === 7 && (
          <g id="stage-guru">
            {/* Great Root Base */}
            <ellipse cx="100" cy="186" rx="80" ry="14" fill="#3e2723" />
            {/* Aerial Prop Roots */}
            <path d="M 45 90 L 50 185" stroke="#5d4037" strokeWidth="6" strokeLinecap="round" />
            <path d="M 65 95 L 68 185" stroke="#6d4c41" strokeWidth="7" strokeLinecap="round" />
            <path d="M 155 90 L 150 185" stroke="#5d4037" strokeWidth="6" strokeLinecap="round" />
            <path d="M 135 95 L 132 185" stroke="#6d4c41" strokeWidth="7" strokeLinecap="round" />

            {/* Massive Central Trunk */}
            <path d="M 78 186 Q 88 115 72 65 L 128 65 Q 112 115 122 186 Z" fill="url(#trunkGrad)" stroke="#271c19" strokeWidth="3" />

            {/* Colossal Emerald Canopy */}
            <ellipse cx="100" cy="55" rx="85" ry="54" fill="#1b5e20" stroke="#0f3d13" strokeWidth="3" />
            <circle cx="35" cy="60" r="38" fill="#2e7d32" opacity="0.95" />
            <circle cx="165" cy="60" r="38" fill="#2e7d32" opacity="0.95" />
            <circle cx="100" cy="18" r="44" fill="#388e3c" />

            {/* Tilak / Third Eye symbol of Wisdom */}
            <path d="M 100 40 Q 98 48 100 52 Q 102 48 100 40 Z" fill="#e11d48" />
            <circle cx="100" cy="54" r="1.5" fill="#facc15" />

            {/* Sage Guru Eyes & Beard */}
            <path d="M 85 58 Q 91 55 95 58" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M 105 58 Q 109 55 115 58" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            {/* Flowing white beard */}
            <path d="M 88 72 Q 100 110 112 72 Q 106 82 100 84 Q 94 82 88 72 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M 95 68 Q 100 74 105 68" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* ─── EQUIPPED ACCESSORIES OVERLAYS ─── */}

        {/* Spectacles */}
        {has("acc-spectacles") && (
          <g id="acc-spectacles" stroke="#1e293b" strokeWidth="2.5" fill="none">
            <circle cx="89" cy="67" r="10" />
            <circle cx="111" cy="67" r="10" />
            <line x1="99" y1="67" x2="101" y2="67" strokeWidth="3" />
            <line x1="79" y1="65" x2="73" y2="62" />
            <line x1="121" y1="65" x2="127" y2="62" />
          </g>
        )}

        {/* Colorful Scarf */}
        {has("acc-scarf") && (
          <g id="acc-scarf">
            <path d="M 80 82 Q 100 95 120 82 L 124 92 Q 100 105 76 92 Z" fill="#e47451" stroke="#b91c1c" strokeWidth="1.5" />
            <path d="M 108 92 L 114 125 L 126 125 L 120 92 Z" fill="#f3bd62" stroke="#b91c1c" strokeWidth="1.5" />
          </g>
        )}

        {/* Gandhi Topi */}
        {has("acc-hat-topi") && (
          <g id="acc-hat-topi">
            <path d="M 75 42 Q 100 24 125 42 Q 100 36 75 42 Z" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
            <ellipse cx="100" cy="40" rx="26" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          </g>
        )}

        {/* Compass (Maths Affinity) */}
        {has("acc-compass-maths") && (
          <g id="acc-compass-maths" transform="translate(140, 105) rotate(15)">
            <circle cx="12" cy="4" r="3" fill="#285d5c" />
            <line x1="12" y1="7" x2="4" y2="35" stroke="#285d5c" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="7" x2="20" y2="35" stroke="#285d5c" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="35" r="1.5" fill="#e47451" />
          </g>
        )}

        {/* Lab Beaker (Science Affinity) */}
        {has("acc-beaker-science") && (
          <g id="acc-beaker-science" transform="translate(35, 110)">
            <path d="M 8 6 L 12 18 L 4 36 Q 16 40 28 36 L 20 18 L 24 6 Z" fill="#5caaa0" fillOpacity="0.7" stroke="#285d5c" strokeWidth="2" />
            {/* Bubbles */}
            <circle cx="14" cy="28" r="2" fill="#ffffff" />
            <circle cx="18" cy="22" r="1.5" fill="#ffffff" />
            <circle cx="12" cy="16" r="1" fill="#ffffff" />
          </g>
        )}

        {/* Cricket Bat Pin */}
        {has("acc-cricket-bat") && (
          <g id="acc-cricket-bat" transform="translate(135, 75) rotate(-25)">
            <rect x="0" y="8" width="6" height="24" rx="2" fill="#854d0e" stroke="#451a03" strokeWidth="1" />
            <rect x="1.5" y="0" width="3" height="9" rx="1" fill="#f8fafc" stroke="#451a03" strokeWidth="1" />
          </g>
        )}

        {/* Diya Light */}
        {has("tree-diya") && (
          <g id="tree-diya" transform="translate(90, 158)">
            <path d="M 0 10 Q 10 18 20 10 Q 15 2 0 10 Z" fill="#c2410c" stroke="#7c2d12" strokeWidth="1" />
            <path d="M 16 7 Q 21 0 18 -4 Q 15 0 16 7 Z" fill="#facc15" />
          </g>
        )}

        {/* Fairy Lights */}
        {has("tree-fairy-lights") && (
          <g id="tree-fairy-lights">
            <path d="M 50 60 Q 100 80 150 60" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="65" cy="65" r="3" fill="#fde047" className="animate-ping" style={{ animationDuration: "2s" }} />
            <circle cx="100" cy="73" r="3" fill="#fde047" className="animate-ping" style={{ animationDuration: "2.5s" }} />
            <circle cx="135" cy="65" r="3" fill="#fde047" className="animate-ping" style={{ animationDuration: "1.8s" }} />
          </g>
        )}
      </svg>

      {/* Stage Badge */}
      {showStageBadge && (
        <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs border bg-background/95">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stageInfo.color }} />
          <span className="font-bold text-foreground">{stageInfo.name}</span>
          <span className="text-muted-foreground text-[10px]">({stageInfo.english})</span>
        </div>
      )}
    </div>
  );
}
