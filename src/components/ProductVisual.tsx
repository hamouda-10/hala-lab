import { useState } from 'react';
import type { Product } from '../data/products';

interface ProductVisualProps {
  product: Product;
  className?: string;
}

export function ProductVisual({ product, className = '' }: ProductVisualProps) {
  const [imgError, setImgError] = useState(false);

  if (product.visualKind === 'image' && product.imageSrc && !imgError) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#18181b] ${className}`}>
        <img
          src={product.imageSrc}
          alt={product.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#151517]/55 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#18181b] flex items-center justify-center ${className}`}
      aria-label={product.name}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-65"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.065), rgba(21,21,23,0.96) 76%)',
        }}
      />
      {product.visualKind === 'svg-electricity' && <ElectricityStudioSvg />}
      {product.visualKind === 'svg-anatomy' && <AnatomyStudioSvg />}
      {product.visualKind === 'svg-meter' && <MeterStudioSvg />}
      {product.visualKind === 'svg-balance' && <BalanceStudioSvg />}
      {product.visualKind === 'svg-burner' && <BurnerStudioSvg />}
      {product.visualKind === 'svg-tuning' && <TuningForkStudioSvg />}
      {product.visualKind === 'svg-pendulum' && <PendulumStudioSvg />}
      {product.visualKind === 'svg-skeleton' && <SkeletonStudioSvg />}
      {product.visualKind === 'svg-safety' && <SafetyStudioSvg />}
      {product.visualKind === 'svg-caliper' && <CaliperStudioSvg />}
      {product.visualKind === 'svg-molecule' && <MoleculeStudioSvg />}
      {product.visualKind === 'svg-dynamo' && <DynamoStudioSvg />}
      {product.visualKind === 'svg-distill' && <DistillStudioSvg />}
      {product.visualKind === 'image' && <FallbackPrismSvg />}
    </div>
  );
}

function ElectricityStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[84%] h-[84%] relative z-10" fill="none">
      <defs>
        <linearGradient id="copperGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d99b66" />
          <stop offset="50%" stopColor="#a86432" />
          <stop offset="100%" stopColor="#5e3315" />
        </linearGradient>
        <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="248" rx="150" ry="18" fill="#09090b" opacity="0.7" />
      <path
        d="M95 198V122C95 90 120 66 150 66C180 66 205 90 205 122V198H182V122C182 103 168 89 150 89C132 89 118 103 118 122V198H95Z"
        fill="#27272a"
        stroke="#52525b"
        strokeWidth="1.5"
      />
      <rect x="95" y="164" width="23" height="34" fill="#b91c1c" />
      <rect x="182" y="164" width="23" height="34" fill="#1d4ed8" />
      <text x="106.5" y="186" textAnchor="middle" fill="#ededed" fontSize="13" fontWeight="700">
        N
      </text>
      <text x="193.5" y="186" textAnchor="middle" fill="#ededed" fontSize="13" fontWeight="700">
        S
      </text>
      <rect x="235" y="114" width="96" height="58" rx="6" fill="#202024" stroke="#3f3f46" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect
          key={i}
          x={244 + i * 9}
          y="108"
          width="5.5"
          height="70"
          rx="2.5"
          fill="url(#copperGrad)"
        />
      ))}
      <rect x="225" y="136" width="116" height="14" rx="3" fill="url(#steelGrad)" opacity="0.55" />
      <path d="M250 178 C250 220, 175 224, 150 215" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M316 178 C316 226, 222 232, 188 220" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="250" cy="178" r="5" fill="#e4e4e7" stroke="#18181b" strokeWidth="2" />
      <circle cx="316" cy="178" r="5" fill="#e4e4e7" stroke="#18181b" strokeWidth="2" />
      <rect x="132" y="210" width="76" height="22" rx="4" fill="#27272a" stroke="#52525b" />
      <line x1="146" y1="221" x2="194" y2="207" stroke="#eab308" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="146" cy="221" r="4" fill="#d4d4d8" />
      <circle cx="196" cy="221" r="4" fill="#d4d4d8" />
    </svg>
  );
}

function MeterStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[84%] h-[84%] relative z-10" fill="none">
      <ellipse cx="200" cy="252" rx="145" ry="16" fill="#09090b" opacity="0.72" />
      <rect x="52" y="72" width="136" height="162" rx="10" fill="#202024" stroke="#3f3f46" strokeWidth="1.5" />
      <rect x="66" y="88" width="108" height="78" rx="6" fill="#141417" stroke="#2e2e34" />
      <path d="M80 150 A44 44 0 0 1 160 150" stroke="#71717a" strokeWidth="1.5" />
      <path d="M90 132 L85 127 M120 108 L120 101 M150 132 L155 127" stroke="#a1a1aa" strokeWidth="1.5" />
      <line x1="120" y1="154" x2="146" y2="115" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="120" cy="154" r="5" fill="#d4d4d8" />
      <text x="120" y="138" textAnchor="middle" fill="#a1a1aa" fontSize="13" fontWeight="600">
        A
      </text>
      <circle cx="88" cy="204" r="10" fill="#18181b" stroke="#52525b" strokeWidth="2" />
      <circle cx="120" cy="204" r="10" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="152" cy="204" r="10" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />

      <rect x="212" y="72" width="136" height="162" rx="10" fill="#202024" stroke="#3f3f46" strokeWidth="1.5" />
      <rect x="226" y="88" width="108" height="78" rx="6" fill="#141417" stroke="#2e2e34" />
      <path d="M240 150 A44 44 0 0 1 320 150" stroke="#71717a" strokeWidth="1.5" />
      <path d="M250 132 L245 127 M280 108 L280 101 M310 132 L315 127" stroke="#a1a1aa" strokeWidth="1.5" />
      <line x1="280" y1="154" x2="298" y2="112" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="280" cy="154" r="5" fill="#d4d4d8" />
      <text x="280" y="138" textAnchor="middle" fill="#a1a1aa" fontSize="13" fontWeight="600">
        V
      </text>
      <circle cx="248" cy="204" r="10" fill="#18181b" stroke="#52525b" strokeWidth="2" />
      <circle cx="280" cy="204" r="10" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="312" cy="204" r="10" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
    </svg>
  );
}

function AnatomyStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <defs>
        <linearGradient id="heartMuscle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9f323a" />
          <stop offset="60%" stopColor="#6b1d26" />
          <stop offset="100%" stopColor="#3f1016" />
        </linearGradient>
        <linearGradient id="veinBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="256" rx="68" ry="12" fill="#27272a" stroke="#52525b" />
      <rect x="196" y="200" width="8" height="54" fill="#71717a" />
      <path d="M190 108 C185 68, 232 58, 240 94 L236 122" stroke="#b91c1c" strokeWidth="16" strokeLinecap="round" />
      <path d="M168 68 V116" stroke="url(#veinBlue)" strokeWidth="14" strokeLinecap="round" />
      <path d="M206 116 C214 96, 238 94, 254 102" stroke="url(#veinBlue)" strokeWidth="12" strokeLinecap="round" />
      <path
        d="M158 118 C138 148, 152 204, 212 222 C248 202, 266 154, 244 120 C228 98, 178 96, 158 118 Z"
        fill="url(#heartMuscle)"
        stroke="#c05660"
        strokeWidth="1.5"
      />
      <path d="M196 126 C202 152, 212 176, 216 206 M204 156 C222 158, 234 166, 244 176" stroke="#fca5a5" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <path d="M188 134 C180 156, 174 172, 168 188" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

function BalanceStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="244" rx="135" ry="15" fill="#09090b" opacity="0.75" />
      <path
        d="M92 178 L112 146 H288 L308 178 V224 C308 230 303 235 297 235 H103 C97 235 92 230 92 224 V178 Z"
        fill="#222227"
        stroke="#3f3f46"
        strokeWidth="1.5"
      />
      <ellipse cx="200" cy="136" rx="76" ry="16" fill="#52525b" stroke="#a1a1aa" strokeWidth="1.5" />
      <ellipse cx="200" cy="133" rx="68" ry="12" fill="#3f3f46" />
      <path d="M188 130 L191 102 H209 L212 130 Z" fill="#d4d4d8" />
      <circle cx="200" cy="98" r="6" fill="#e4e4e7" />
      <rect x="128" y="186" width="144" height="32" rx="5" fill="#0f172a" stroke="#334155" />
      <text x="200" y="208" textAnchor="middle" fill="#38bdf8" fontSize="18" fontFamily="monospace" fontWeight="600">
        100.00 g
      </text>
    </svg>
  );
}

function BurnerStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="252" rx="110" ry="14" fill="#09090b" opacity="0.75" />
      {/* Tripod stand */}
      <ellipse cx="200" cy="140" rx="68" ry="10" stroke="#71717a" strokeWidth="4" />
      <line x1="142" y1="143" x2="116" y2="248" stroke="#52525b" strokeWidth="5" strokeLinecap="round" />
      <line x1="258" y1="143" x2="284" y2="248" stroke="#52525b" strokeWidth="5" strokeLinecap="round" />
      <line x1="200" y1="148" x2="200" y2="242" stroke="#3f3f46" strokeWidth="4" strokeLinecap="round" />
      {/* Wire gauze */}
      <rect x="142" y="132" width="116" height="6" rx="2" fill="#a1a1aa" opacity="0.7" />
      {/* Glass beaker on top */}
      <path d="M164 68 V128 C164 131 168 132 172 132 H228 C232 132 236 131 236 128 V68" stroke="#d4d4d8" strokeWidth="2" fill="rgba(56,189,248,0.08)" />
      <rect x="166" y="96" width="68" height="34" fill="rgba(56,189,248,0.22)" />
      {/* Alcohol burner below */}
      <path d="M168 242 L176 196 H224 L232 242 Z" fill="rgba(255,255,255,0.08)" stroke="#a1a1aa" strokeWidth="1.5" />
      <rect x="190" y="182" width="20" height="14" rx="2" fill="#d4d4d8" />
      {/* Flame */}
      <path d="M200 144 C212 162, 210 178, 200 182 C190 178, 188 162, 200 144 Z" fill="#f59e0b" opacity="0.88" />
      <path d="M200 158 C205 168, 204 178, 200 180 C196 178, 195 168, 200 158 Z" fill="#60a5fa" />
    </svg>
  );
}

function TuningForkStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="252" rx="130" ry="14" fill="#09090b" opacity="0.75" />
      {/* Resonance wood box */}
      <rect x="108" y="180" width="184" height="60" rx="5" fill="#2c241d" stroke="#6b5340" strokeWidth="1.5" />
      <rect x="122" y="192" width="38" height="36" rx="2" fill="#14110f" stroke="#4a382b" />
      {/* Tuning fork */}
      <rect x="196" y="144" width="8" height="36" fill="#d4d4d8" />
      <path d="M174 58 V126 C174 142 226 142 226 126 V58" stroke="#e4e4e7" strokeWidth="9" strokeLinecap="round" />
      {/* Sound wave arcs */}
      <path d="M150 74 C140 88 140 108 150 122" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M134 62 C118 84 118 112 134 134" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
      <path d="M250 74 C260 88 260 108 250 122" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M266 62 C282 84 282 112 266 134" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function PendulumStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="254" rx="120" ry="14" fill="#09090b" opacity="0.75" />
      {/* Base & vertical rod */}
      <rect x="112" y="236" width="128" height="14" rx="3" fill="#27272a" stroke="#52525b" />
      <rect x="138" y="54" width="8" height="184" fill="#a1a1aa" />
      <rect x="138" y="56" width="110" height="8" rx="2" fill="#d4d4d8" />
      {/* Swing arc */}
      <path d="M180 198 A145 145 0 0 0 284 176" stroke="#52525b" strokeWidth="1.5" strokeDasharray="4 4" />
      {/* String & brass bob */}
      <line x1="234" y1="64" x2="266" y2="184" stroke="#e4e4e7" strokeWidth="1.6" />
      <circle cx="266" cy="196" r="16" fill="#d99b66" stroke="#fef08a" strokeWidth="1.2" />
      {/* Ghost equilibrium bob */}
      <line x1="234" y1="64" x2="234" y2="196" stroke="#71717a" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="234" cy="206" r="14" stroke="#52525b" strokeWidth="1.2" fill="rgba(255,255,255,0.03)" />
    </svg>
  );
}

function SkeletonStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="264" rx="64" ry="11" fill="#27272a" stroke="#52525b" />
      <line x1="200" y1="210" x2="200" y2="260" stroke="#71717a" strokeWidth="4" />
      {/* Skull */}
      <ellipse cx="200" cy="64" rx="20" ry="24" fill="#e4e4e7" />
      <circle cx="192" cy="62" r="4.5" fill="#18181b" />
      <circle cx="208" cy="62" r="4.5" fill="#18181b" />
      <rect x="193" y="76" width="14" height="6" rx="2" fill="#d4d4d8" />
      {/* Spine & Ribcage */}
      <line x1="200" y1="88" x2="200" y2="176" stroke="#d4d4d8" strokeWidth="6" strokeLinecap="round" />
      {[102, 114, 126, 138, 150].map((y, i) => (
        <path
          key={y}
          d={`M${172 + i * 2} ${y} Q200 ${y + 10} ${228 - i * 2} ${y}`}
          stroke="#e4e4e7"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      ))}
      {/* Pelvis */}
      <path d="M178 174 Q200 194 222 174 Q216 196 200 194 Q184 196 178 174 Z" fill="#d4d4d8" />
      {/* Arms */}
      <path d="M168 100 L152 146 L146 190" stroke="#d4d4d8" strokeWidth="5" strokeLinecap="round" />
      <path d="M232 100 L248 146 L254 190" stroke="#d4d4d8" strokeWidth="5" strokeLinecap="round" />
      {/* Legs */}
      <path d="M186 192 L182 238 L178 258" stroke="#e4e4e7" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M214 192 L218 238 L222 258" stroke="#e4e4e7" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

function SafetyStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="248" rx="135" ry="16" fill="#09090b" opacity="0.72" />
      {/* Lab Coat Silhouette */}
      <path
        d="M148 76 L176 62 L200 98 L224 62 L252 76 L278 146 L256 154 L244 114 V234 H156 V114 L144 154 L122 146 Z"
        fill="#27272a"
        stroke="#d4d4d8"
        strokeWidth="2"
      />
      <line x1="200" y1="98" x2="200" y2="234" stroke="#52525b" strokeWidth="1.5" />
      <rect x="164" y="164" width="24" height="28" rx="2" stroke="#71717a" strokeWidth="1.4" />
      <rect x="212" y="164" width="24" height="28" rx="2" stroke="#71717a" strokeWidth="1.4" />
      {/* Safety Goggles overlay */}
      <rect x="138" y="114" width="124" height="44" rx="14" fill="rgba(56,189,248,0.14)" stroke="#e4e4e7" strokeWidth="2.4" />
      <path d="M184 158 C192 144, 208 144, 216 158" stroke="#e4e4e7" strokeWidth="2.4" />
    </svg>
  );
}

function CaliperStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[86%] h-[86%] relative z-10" fill="none">
      <ellipse cx="200" cy="236" rx="150" ry="14" fill="#09090b" opacity="0.72" />
      {/* Main Vernier Beam */}
      <rect x="52" y="124" width="296" height="28" rx="3" fill="#3f3f46" stroke="#a1a1aa" strokeWidth="1.5" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1={76 + i * 11}
          y1="124"
          x2={76 + i * 11}
          y2={i % 5 === 0 ? '138' : '132'}
          stroke="#e4e4e7"
          strokeWidth="1.2"
        />
      ))}
      {/* Fixed Jaw */}
      <path d="M52 124 V82 L70 104 V124 Z" fill="#71717a" stroke="#d4d4d8" strokeWidth="1.2" />
      <path d="M52 152 V214 L76 190 V152 Z" fill="#71717a" stroke="#d4d4d8" strokeWidth="1.2" />
      {/* Sliding Vernier Jaw */}
      <rect x="136" y="118" width="76" height="40" rx="4" fill="#27272a" stroke="#e4e4e7" strokeWidth="1.6" />
      <path d="M136 118 V82 L152 104 V118 Z" fill="#a1a1aa" />
      <path d="M136 158 V214 L158 190 V158 Z" fill="#a1a1aa" />
      {/* Digital/Vernier readout window */}
      <rect x="148" y="128" width="52" height="20" rx="2" fill="#0f172a" />
      <text x="174" y="142" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">
        24.62
      </text>
    </svg>
  );
}

function MoleculeStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      {/* Bonds */}
      <line x1="200" y1="88" x2="254" y2="120" stroke="#a1a1aa" strokeWidth="6" />
      <line x1="254" y1="120" x2="254" y2="182" stroke="#a1a1aa" strokeWidth="6" />
      <line x1="254" y1="182" x2="200" y2="214" stroke="#a1a1aa" strokeWidth="6" />
      <line x1="200" y1="214" x2="146" y2="182" stroke="#a1a1aa" strokeWidth="6" />
      <line x1="146" y1="182" x2="146" y2="120" stroke="#a1a1aa" strokeWidth="6" />
      <line x1="146" y1="120" x2="200" y2="88" stroke="#a1a1aa" strokeWidth="6" />
      {/* Outer H bonds */}
      <line x1="200" y1="88" x2="200" y2="48" stroke="#71717a" strokeWidth="4" />
      <line x1="254" y1="120" x2="294" y2="98" stroke="#71717a" strokeWidth="4" />
      <line x1="254" y1="182" x2="294" y2="204" stroke="#71717a" strokeWidth="4" />
      <line x1="200" y1="214" x2="200" y2="252" stroke="#71717a" strokeWidth="4" />
      <line x1="146" y1="182" x2="106" y2="204" stroke="#71717a" strokeWidth="4" />
      <line x1="146" y1="120" x2="106" y2="98" stroke="#71717a" strokeWidth="4" />
      {/* Carbon ring atoms */}
      {[
        [200, 88],
        [254, 120],
        [254, 182],
        [200, 214],
        [146, 182],
        [146, 120],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="15" fill="#27272a" stroke="#e4e4e7" strokeWidth="2" />
      ))}
      {/* Hydrogen & Oxygen atoms */}
      <circle cx="200" cy="48" r="11" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
      <circle cx="294" cy="98" r="10" fill="#e4e4e7" />
      <circle cx="294" cy="204" r="10" fill="#e4e4e7" />
      <circle cx="200" cy="252" r="11" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="106" cy="204" r="10" fill="#e4e4e7" />
      <circle cx="106" cy="98" r="10" fill="#e4e4e7" />
    </svg>
  );
}

function DynamoStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[82%] h-[82%] relative z-10" fill="none">
      <ellipse cx="200" cy="248" rx="135" ry="15" fill="#09090b" opacity="0.72" />
      {/* Base */}
      <rect x="86" y="214" width="228" height="24" rx="5" fill="#27272a" stroke="#52525b" />
      {/* Transparent generator body */}
      <rect x="136" y="102" width="128" height="112" rx="12" fill="rgba(255,255,255,0.06)" stroke="#a1a1aa" strokeWidth="1.8" />
      {/* Copper stator & magnet */}
      <circle cx="200" cy="158" r="38" stroke="#d99b66" strokeWidth="12" strokeDasharray="16 6" />
      <circle cx="200" cy="158" r="18" fill="#3f3f46" stroke="#d4d4d8" strokeWidth="2" />
      {/* Crank handle */}
      <line x1="264" y1="158" x2="314" y2="122" stroke="#e4e4e7" strokeWidth="6" strokeLinecap="round" />
      <rect x="306" y="106" width="24" height="12" rx="4" fill="#dc2626" />
      {/* Glowing bulb on top */}
      <circle cx="200" cy="70" r="18" fill="rgba(250,204,21,0.28)" stroke="#facc15" strokeWidth="2" />
      <path d="M194 74 L200 62 L206 74" stroke="#fef08a" strokeWidth="2" />
      <rect x="192" y="88" width="16" height="14" fill="#71717a" />
    </svg>
  );
}

function DistillStudioSvg() {
  return (
    <svg viewBox="0 0 400 300" className="w-[84%] h-[84%] relative z-10" fill="none">
      <ellipse cx="200" cy="252" rx="145" ry="15" fill="#09090b" opacity="0.72" />
      {/* Round-bottom boiling flask */}
      <circle cx="118" cy="196" r="40" fill="rgba(56,189,248,0.12)" stroke="#d4d4d8" strokeWidth="2" />
      <path d="M84 210 C102 224 134 224 152 210 C144 232 92 232 84 210 Z" fill="rgba(56,189,248,0.35)" />
      <rect x="110" y="96" width="16" height="62" stroke="#d4d4d8" strokeWidth="2" />
      {/* Liebig angled condenser */}
      <line x1="126" y1="112" x2="278" y2="168" stroke="#e4e4e7" strokeWidth="5" />
      <path d="M150 112 L258 152 L250 170 L142 130 Z" fill="rgba(56,189,248,0.14)" stroke="#94a3b8" strokeWidth="1.6" />
      {/* Receiving Erlenmeyer flask */}
      <path d="M276 168 L292 168 L316 238 H252 Z" fill="rgba(16,185,129,0.12)" stroke="#d4d4d8" strokeWidth="2" />
      <path d="M262 212 H306 L314 236 H254 Z" fill="rgba(16,185,129,0.32)" />
    </svg>
  );
}

function FallbackPrismSvg() {
  return (
    <svg viewBox="0 0 240 180" className="w-40 h-32 opacity-70" fill="none">
      <polygon points="120,24 202,152 38,152" stroke="#a1a1aa" strokeWidth="1.8" fill="rgba(255,255,255,0.04)" />
    </svg>
  );
}
