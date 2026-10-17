import React from 'react';

// 1. Mathematics: Coordinate plane & linear model diagram
export const MathCoordinatePlaneVisual: React.FC<{ className?: string }> = ({ className = 'w-full h-24' }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[var(--lavender-soft)]/60 border border-[var(--border)] p-2 ${className}`}>
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Grid lines */}
      <g stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 2">
        <line x1="20" y1="20" x2="180" y2="20" />
        <line x1="20" y1="40" x2="180" y2="40" />
        <line x1="20" y1="60" x2="180" y2="60" />
        <line x1="20" y1="80" x2="180" y2="80" />
        <line x1="40" y1="10" x2="40" y2="90" />
        <line x1="70" y1="10" x2="70" y2="90" />
        <line x1="100" y1="10" x2="100" y2="90" />
        <line x1="130" y1="10" x2="130" y2="90" />
        <line x1="160" y1="10" x2="160" y2="90" />
      </g>
      {/* Axes */}
      <line x1="20" y1="50" x2="180" y2="50" stroke="var(--text)" strokeWidth="1.25" />
      <line x1="100" y1="10" x2="100" y2="90" stroke="var(--text)" strokeWidth="1.25" />
      {/* Arrows */}
      <polygon points="180,50 174,47 174,53" fill="var(--text)" />
      <polygon points="100,10 97,16 103,16" fill="var(--text)" />
      {/* Linear slope equation line y = mx + b */}
      <line x1="35" y1="80" x2="165" y2="20" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Data points */}
      <circle cx="100" cy="50" r="3.5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="1.5" />
      <circle cx="135" cy="34" r="3" fill="var(--primary)" stroke="var(--surface)" strokeWidth="1" />
      <circle cx="65" cy="66" r="3" fill="var(--primary)" stroke="var(--surface)" strokeWidth="1" />
      {/* Label */}
      <rect x="110" y="14" width="62" height="15" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <text x="141" y="25" textAnchor="middle" fill="var(--primary)" fontSize="8" fontWeight="bold" fontFamily="monospace">y = 0.5x + 0</text>
    </svg>
  </div>
);

// 2. Science: Ecosystem dynamics, food web & energy pyramid
export const ScienceEcosystemVisual: React.FC<{ className?: string }> = ({ className = 'w-full h-24' }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[var(--lavender-soft)]/60 border border-[var(--border)] p-2 ${className}`}>
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Trophic Levels Energy Flow Triangle */}
      {/* Level 3: Apex Predator */}
      <polygon points="100,12 125,36 75,36" fill="var(--primary)" opacity="0.9" />
      <text x="100" y="28" textAnchor="middle" fill="var(--on-primary)" fontSize="7" fontWeight="bold">Apex (10J)</text>

      {/* Level 2: Secondary Consumers */}
      <polygon points="73,39 127,39 145,62 55,62" fill="var(--accent)" opacity="0.85" />
      <text x="100" y="53" textAnchor="middle" fill="var(--on-primary)" fontSize="7" fontWeight="bold">Consumers (100J)</text>

      {/* Level 1: Primary Producers */}
      <polygon points="53,65 147,65 170,88 30,88" fill="var(--lavender-soft)" opacity="0.9" stroke="var(--border)" />
      <text x="100" y="79" textAnchor="middle" fill="var(--text)" fontSize="7" fontWeight="bold">Primary Producers (1,000J)</text>

      {/* Solar Energy Sun Icon on left */}
      <circle cx="24" cy="24" r="8" fill="var(--accent)" opacity="0.8" />
      <path d="M 24 10 L 24 13 M 24 35 L 24 38 M 10 24 L 13 24 M 35 24 L 38 24" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 28 32 Q 40 45, 52 68" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />

      {/* 10% Transfer Indicator */}
      <rect x="152" y="38" width="40" height="15" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <text x="172" y="49" textAnchor="middle" fill="var(--primary)" fontSize="7.5" fontWeight="bold">10% Rule</text>
    </svg>
  </div>
);

// 3. Humanities: Rhetorical triangle & persuasive writing mastery
export const HumanitiesRhetoricVisual: React.FC<{ className?: string }> = ({ className = 'w-full h-24' }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[var(--lavender-soft)]/60 border border-[var(--border)] p-2 ${className}`}>
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Rhetorical Triangle (Ethos, Pathos, Logos) */}
      <polygon points="100,16 160,78 40,78" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.5" />
      
      {/* Inner Synthesis Circle */}
      <circle cx="100" cy="54" r="16" fill="var(--lavender-soft)" stroke="var(--border)" strokeWidth="1" />
      <text x="100" y="56" textAnchor="middle" fill="var(--text)" fontSize="7" fontWeight="bold">Argument</text>
      <text x="100" y="64" textAnchor="middle" fill="var(--text-muted)" fontSize="5.5">Synthesis</text>

      {/* Nodes */}
      {/* Top: Ethos (Credibility) */}
      <circle cx="100" cy="16" r="4.5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="1.5" />
      <rect x="74" y="2" width="52" height="11" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.75" />
      <text x="100" y="10" textAnchor="middle" fill="var(--primary)" fontSize="6.5" fontWeight="bold">ETHOS (Credibility)</text>

      {/* Bottom Right: Logos (Reasoning & Evidence) */}
      <circle cx="160" cy="78" r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
      <rect x="135" y="82" width="50" height="11" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.75" />
      <text x="160" y="90" textAnchor="middle" fill="var(--accent)" fontSize="6.5" fontWeight="bold">LOGOS (Logic)</text>

      {/* Bottom Left: Pathos (Audience Emotion) */}
      <circle cx="40" cy="78" r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
      <rect x="15" y="82" width="50" height="11" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.75" />
      <text x="40" y="90" textAnchor="middle" fill="var(--primary)" fontSize="6.5" fontWeight="bold">PATHOS (Emotion)</text>
    </svg>
  </div>
);

// 4. Computer Science: Python computational thinking & flowchart logic
export const ComputerScienceFlowchartVisual: React.FC<{ className?: string }> = ({ className = 'w-full h-24' }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[var(--lavender-soft)]/60 border border-[var(--border)] p-2 ${className}`}>
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Code Snippet Card */}
      <g transform="translate(15, 12)">
        <rect x="0" y="0" width="75" height="74" rx="4" fill="var(--surface)" stroke="var(--border)" />
        <circle cx="7" cy="7" r="2" fill="var(--accent)" />
        <circle cx="13" cy="7" r="2" fill="var(--primary)" />
        <circle cx="19" cy="7" r="2" fill="var(--lavender-soft)" />
        <text x="7" y="22" fill="var(--accent)" fontSize="6" fontFamily="monospace">def calc(x):</text>
        <text x="12" y="32" fill="var(--text)" fontSize="6" fontFamily="monospace">  if x &gt; 0:</text>
        <text x="18" y="42" fill="var(--primary)" fontSize="6" fontFamily="monospace">    return x*2</text>
        <text x="12" y="52" fill="var(--text)" fontSize="6" fontFamily="monospace">  else:</text>
        <text x="18" y="62" fill="var(--text-muted)" fontSize="6" fontFamily="monospace">    return 0</text>
      </g>

      {/* Logic Flowchart Connected */}
      <g transform="translate(100, 10)">
        {/* Start / Input Pill */}
        <rect x="15" y="2" width="46" height="14" rx="7" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1" />
        <text x="38" y="11.5" textAnchor="middle" fill="var(--primary)" fontSize="6.5" fontWeight="bold">Input: x</text>

        {/* Down Arrow */}
        <line x1="38" y1="16" x2="38" y2="24" stroke="var(--text-muted)" strokeWidth="1" />

        {/* Decision Diamond: x > 0 ? */}
        <polygon points="38,24 58,36 38,48 18,36" fill="var(--lavender-soft)" stroke="var(--accent)" strokeWidth="1" />
        <text x="38" y="38" textAnchor="middle" fill="var(--primary)" fontSize="6" fontWeight="bold">x &gt; 0 ?</text>

        {/* True branch */}
        <line x1="58" y1="36" x2="72" y2="36" stroke="var(--primary)" strokeWidth="1" />
        <line x1="72" y1="36" x2="72" y2="58" stroke="var(--primary)" strokeWidth="1" />
        <rect x="52" y="58" width="40" height="14" rx="3" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1" />
        <text x="72" y="67" textAnchor="middle" fill="var(--primary)" fontSize="6" fontWeight="bold">2x</text>

        {/* False branch */}
        <line x1="18" y1="36" x2="5" y2="36" stroke="var(--text-muted)" strokeWidth="1" />
        <line x1="5" y1="36" x2="5" y2="58" stroke="var(--text-muted)" strokeWidth="1" />
        <rect x="-8" y="58" width="26" height="14" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
        <text x="5" y="67" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontWeight="bold">0</text>
      </g>
    </svg>
  </div>
);
