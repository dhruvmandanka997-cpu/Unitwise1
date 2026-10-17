import React from 'react';

interface AcademicHeroIllustrationProps {
  className?: string;
}

export const AcademicHeroIllustration: React.FC<AcademicHeroIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 380 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[200px] select-none"
      >
        <defs>
          {/* Soft Neumorphic & Lavender Gradients linked to Design Tokens */}
          <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--border)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--border)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--border)" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="primaryBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>

          <linearGradient id="lavenderBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>

          <linearGradient id="darkBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--text)" />
            <stop offset="100%" stopColor="var(--surface)" />
          </linearGradient>

          <linearGradient id="pageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--surface)" />
            <stop offset="100%" stopColor="var(--bg)" />
          </linearGradient>

          <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--lavender-soft)" />
            <stop offset="100%" stopColor="var(--border)" />
          </linearGradient>
        </defs>

        {/* Ambient Decorative Geometry with Soft Lavender */}
        <circle cx="280" cy="90" r="75" fill="var(--primary)" fillOpacity="0.08" />
        <circle cx="100" cy="110" r="55" fill="var(--accent)" fillOpacity="0.06" />
        <circle cx="310" cy="50" r="4" fill="var(--primary)" fillOpacity="0.3" />
        <circle cx="70" cy="70" r="3" fill="var(--accent)" fillOpacity="0.35" />
        <circle cx="330" cy="130" r="2.5" fill="var(--primary)" fillOpacity="0.25" />

        {/* Planning Grid Accent in Background */}
        <g opacity="0.16" stroke="var(--text)" strokeWidth="0.75" strokeDasharray="3 3">
          <line x1="160" y1="30" x2="360" y2="30" />
          <line x1="160" y1="60" x2="360" y2="60" />
          <line x1="160" y1="90" x2="360" y2="90" />
          <line x1="200" y1="15" x2="200" y2="110" />
          <line x1="260" y1="15" x2="260" y2="110" />
          <line x1="320" y1="15" x2="320" y2="110" />
        </g>

        {/* Study Desk Base Surface */}
        <path d="M 40 185 L 350 185" stroke="url(#deskGrad)" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="195" cy="186" rx="140" ry="4" fill="var(--border)" fillOpacity="0.25" />

        {/* Stack of Educational Curriculum Books */}
        {/* Book 1 (Bottom) */}
        <rect x="75" y="162" width="125" height="18" rx="3" fill="url(#darkBookGrad)" />
        <rect x="77" y="165" width="118" height="12" rx="1" fill="url(#pageGrad)" />
        <path d="M 75 162 L 75 180" stroke="var(--text)" strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="165" x2="82" y2="177" stroke="var(--border)" strokeWidth="1" opacity="0.6" />
        <line x1="86" y1="165" x2="86" y2="177" stroke="var(--border)" strokeWidth="1" opacity="0.6" />

        {/* Book 2 (Middle) */}
        <rect x="85" y="145" width="110" height="17" rx="3" fill="url(#lavenderBookGrad)" />
        <rect x="87" y="148" width="104" height="11" rx="1" fill="url(#pageGrad)" />
        <path d="M 85 145 L 85 162" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        <line x1="92" y1="148" x2="92" y2="159" stroke="var(--lavender-soft)" strokeWidth="1" opacity="0.8" />
        <line x1="96" y1="148" x2="96" y2="159" stroke="var(--lavender-soft)" strokeWidth="1" opacity="0.8" />

        {/* Book 3 (Top) */}
        <rect x="92" y="129" width="98" height="16" rx="3" fill="url(#primaryBookGrad)" />
        <rect x="94" y="132" width="92" height="10" rx="1" fill="url(#pageGrad)" />
        <path d="M 92 129 L 92 145" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        {/* Ribbon bookmark in soft lavender */}
        <path d="M 140 145 L 140 168 L 145 163 L 150 168 L 150 145 Z" fill="var(--lavender-soft)" stroke="var(--border)" strokeWidth="0.5" opacity="0.95" />

        {/* Open Curriculum Blueprint Notebook */}
        <g transform="translate(195, 120)">
          {/* Left page */}
          <path d="M 0 45 C 15 42, 35 42, 45 44 L 45 10 C 35 8, 15 8, 0 12 Z" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          {/* Right page */}
          <path d="M 45 44 C 55 42, 75 42, 90 45 L 90 12 C 75 8, 55 8, 45 10 Z" fill="var(--bg)" stroke="var(--border)" strokeWidth="1" />
          {/* Center spine */}
          <line x1="45" y1="10" x2="45" y2="44" stroke="var(--border)" strokeWidth="1.5" />
          {/* Blueprint lesson lines */}
          <line x1="8" y1="18" x2="36" y2="17" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
          <line x1="8" y1="24" x2="32" y2="23" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="8" y1="30" x2="38" y2="29" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          <line x1="8" y1="36" x2="26" y2="35" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

          {/* Right page diagram */}
          <rect x="52" y="16" width="30" height="15" rx="2" fill="var(--lavender-soft)" stroke="var(--primary)" strokeWidth="0.75" opacity="0.9" />
          <line x1="56" y1="37" x2="80" y2="37" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Drafting Ruler & Pencil */}
        <g transform="translate(160, 172) rotate(-14)">
          <rect x="0" y="0" width="70" height="8" rx="1.5" fill="var(--lavender-soft)" stroke="var(--border)" strokeWidth="0.75" />
          {/* Ticks */}
          <line x1="10" y1="0" x2="10" y2="3" stroke="var(--primary)" strokeWidth="0.75" />
          <line x1="20" y1="0" x2="20" y2="4" stroke="var(--primary)" strokeWidth="0.75" />
          <line x1="30" y1="0" x2="30" y2="3" stroke="var(--primary)" strokeWidth="0.75" />
          <line x1="40" y1="0" x2="40" y2="4" stroke="var(--primary)" strokeWidth="0.75" />
          <line x1="50" y1="0" x2="50" y2="3" stroke="var(--primary)" strokeWidth="0.75" />
          <line x1="60" y1="0" x2="60" y2="4" stroke="var(--primary)" strokeWidth="0.75" />
        </g>

        {/* Academic Stylus / Pencil */}
        <g transform="translate(230, 168) rotate(22)">
          <rect x="0" y="0" width="45" height="4" rx="1" fill="var(--primary)" />
          <polygon points="45,0 52,2 45,4" fill="var(--lavender-soft)" />
          <polygon points="50,1.5 52,2 50,2.5" fill="var(--text)" />
          <rect x="-4" y="0" width="4" height="4" rx="1" fill="var(--accent)" />
        </g>

        {/* Study Desk Accent Pot & Healthy Plant */}
        <g transform="translate(295, 138)">
          <path d="M 8 26 L 12 44 L 28 44 L 32 26 Z" fill="url(#potGrad)" stroke="var(--border)" strokeWidth="1" />
          <ellipse cx="20" cy="26" rx="12" ry="3" fill="var(--lavender-soft)" />
          <ellipse cx="20" cy="27" rx="10" ry="2" fill="var(--text-muted)" />

          {/* Plant Leaves in Soft Indigo/Lavender */}
          <path d="M 20 27 Q 15 12, 6 10 Q 12 18, 19 25" fill="var(--primary)" opacity="0.8" />
          <path d="M 20 27 Q 24 10, 34 8 Q 28 17, 21 25" fill="var(--accent)" opacity="0.8" />
          <path d="M 20 26 Q 20 6, 17 2 Q 22 10, 21 25" fill="var(--accent)" opacity="0.75" />
        </g>

        {/* Graduation Cap Motif in Background */}
        <g transform="translate(315, 60) scale(0.65)" opacity="0.3">
          <polygon points="20,5 38,13 20,21 2,13" fill="var(--primary)" />
          <path d="M 8 16 L 8 26 C 8 32, 32 32, 32 26 L 32 16" fill="var(--primary)" />
          <line x1="34" y1="13" x2="38" y2="25" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="38" cy="26" r="1.5" fill="var(--accent)" />
        </g>
      </svg>
    </div>
  );
};
