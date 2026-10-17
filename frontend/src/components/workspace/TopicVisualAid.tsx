import React, { useState } from 'react';
import { 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  HelpCircle,
  Compass,
  Layers,
  ChevronDown
} from 'lucide-react';

export type VisualCategory = 
  | 'auto'
  | 'fractions'
  | 'algebra'
  | 'geometry'
  | 'science'
  | 'cs'
  | 'history'
  | 'literature'
  | 'general';

interface TopicVisualAidProps {
  topic: string;
  subject: string;
  lessonTitle: string;
  gradeLevel?: string;
}

export const TopicVisualAid: React.FC<TopicVisualAidProps> = ({
  topic,
  subject,
  lessonTitle,
  gradeLevel = 'Middle School',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VisualCategory>('auto');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Detect category from topic, subject, and title
  const detectedCategory = React.useMemo<Exclude<VisualCategory, 'auto'>>(() => {
    const combined = `${topic} ${subject} ${lessonTitle}`.toLowerCase();

    if (/fraction|decimal|ratio|proportion|percent|number line|half|quarter|numerator|denominator/.test(combined)) {
      return 'fractions';
    }
    if (/algebra|equation|function|slope|coordinate|graph|linear|variable|polynomial|axis|intercept/.test(combined)) {
      return 'algebra';
    }
    if (/geometry|angle|triangle|shape|perimeter|area|polygon|pythagorean|hypotenuse|circle|radius/.test(combined)) {
      return 'geometry';
    }
    if (/science|ecosystem|biology|photosynthesis|food web|trophic|water cycle|pollution|cell|organism|energy flow|climate/.test(combined)) {
      return 'science';
    }
    if (/computer|code|programming|python|algorithm|flowchart|variable|loop|logic|software|debugging|binary/.test(combined)) {
      return 'cs';
    }
    if (/history|timeline|war|revolution|civilization|government|constitution|century|treaty|historical|colony/.test(combined)) {
      return 'history';
    }
    if (/literature|reading|novel|plot|character|theme|metaphor|rhetoric|ethos|pathos|logos|poetry|essay|narrative/.test(combined)) {
      return 'literature';
    }
    return 'general';
  }, [topic, subject, lessonTitle]);

  const activeCategory = selectedCategory === 'auto' ? detectedCategory : selectedCategory;

  const categoryTitles: Record<Exclude<VisualCategory, 'auto'>, { title: string; subtitle: string; tip: string }> = {
    fractions: {
      title: 'Fraction Models & Number Line',
      subtitle: 'Part-whole relationships and unit partition visualization',
      tip: 'Project this visual during guided practice to anchor equivalent fractions and benchmark numbers (0, ½, 1).',
    },
    algebra: {
      title: 'Coordinate Plane & Linear Model',
      subtitle: 'Cartesian grid, slope rate of change, and intercept analysis',
      tip: 'Refer to this coordinate plane when discussing positive vs. negative slopes and point-slope relationships.',
    },
    geometry: {
      title: 'Geometric Decomposition & Proofs',
      subtitle: 'Right triangle relationships, angle sums, and theorem labeling',
      tip: 'Use this diagram to connect visual geometry proofs with algebraic calculations (a² + b² = c²).',
    },
    science: {
      title: 'Ecosystem Energy & Trophic Cascade',
      subtitle: 'Producer, consumer, and decomposer nutrient transfer model',
      tip: 'Trace energy dissipation (10% rule) from primary producers upward through apex predators.',
    },
    cs: {
      title: 'Algorithmic Flowchart & Logic Branch',
      subtitle: 'Decision nodes, iteration loop, and state transition flow',
      tip: 'Walk students through conditional evaluation (True/False branches) before coding the solution.',
    },
    history: {
      title: 'Chronological Context Timeline',
      subtitle: 'Cause-and-effect sequence and milestone contextualization',
      tip: 'Help students identify preceding catalysts and downstream consequences of key historical inflection points.',
    },
    literature: {
      title: 'Narrative Arc & Rhetorical Framework',
      subtitle: 'Story mountain trajectory and ethos/pathos/logos balance',
      tip: 'Have students pinpoint where the current text passage sits along this rising action and thematic apex.',
    },
    general: {
      title: 'Backward-Design Conceptual Blueprint',
      subtitle: 'Inquiry question, guided exploration, and evidence synthesis',
      tip: 'Anchor the lesson by pointing students back to the overarching inquiry question at phase transitions.',
    },
  };

  const meta = categoryTitles[activeCategory];

  return (
    <div className={`neu-card-sm p-4 sm:p-5 transition-all ${
      isExpanded ? 'ring-2 ring-[var(--primary)] shadow-neu-hover' : ''
    }`}>
      {/* Visual Header */}
      <div className="space-y-1.5 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="neu-icon-box">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
              Visual Learning Aid
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">&bull;</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium truncate">{gradeLevel}</span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className="neu-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]"
                title="Change visual diagram type"
              >
                <Compass className="h-3 w-3 text-[var(--primary)]" />
                <span className="capitalize">
                  {selectedCategory === 'auto' ? `Auto: ${activeCategory}` : activeCategory}
                </span>
                <ChevronDown className="h-2.5 w-2.5" />
              </button>

              {showCategoryMenu && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-48 rounded-[16px] border border-[var(--border)] bg-white py-1.5 shadow-neu-raised z-30"
                  onClick={() => setShowCategoryMenu(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Visual Topic Style
                  </div>
                  {(['auto', 'fractions', 'algebra', 'geometry', 'science', 'cs', 'history', 'literature', 'general'] as VisualCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[var(--lavender-soft)] text-[var(--primary)] font-bold'
                          : 'text-[var(--text)] hover:bg-[var(--lavender-soft)]/40 font-medium'
                      }`}
                    >
                      <span className="capitalize">{cat === 'cs' ? 'Computer Science' : cat}</span>
                      {selectedCategory === cat && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--lavender-soft)]/40 transition-colors"
              title={isExpanded ? 'Standard view' : 'Enlarge visual aid'}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Full Visible Title */}
        <h4 className="text-xs font-bold text-[var(--text)] leading-snug">
          {meta.title}
        </h4>
      </div>

      {/* SVG Canvas Area */}
      <div className={`mt-3 rounded-[16px] border border-[var(--border)] bg-[var(--lavender-soft)]/20 p-3 flex items-center justify-center transition-all ${
        isExpanded ? 'h-80 sm:h-96' : 'h-52 sm:h-60'
      }`}>
        {activeCategory === 'fractions' && <FractionsVisual />}
        {activeCategory === 'algebra' && <AlgebraVisual />}
        {activeCategory === 'geometry' && <GeometryVisual />}
        {activeCategory === 'science' && <ScienceVisual />}
        {activeCategory === 'cs' && <ComputerScienceVisual />}
        {activeCategory === 'history' && <HistoryVisual />}
        {activeCategory === 'literature' && <LiteratureVisual />}
        {activeCategory === 'general' && <GeneralVisual />}
      </div>

      {/* Pedagogical Caption & Usage Hint */}
      <div className="mt-3 space-y-1.5">
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium">
          {meta.subtitle}
        </p>
        <div className="flex items-start gap-2 rounded-[12px] bg-[var(--lavender-soft)]/50 border border-[var(--border)] p-2.5 text-[10px] text-[var(--text)]">
          <span className="font-bold text-[var(--primary)] shrink-0">Pedagogical Tip:</span>
          <p className="leading-relaxed text-[var(--text-muted)]">
            {meta.tip}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Bespoke SVG Illustrations with Strict Color Identity ---

// 1. Fractions Visual: Fraction circle, bar partition, and number line
const FractionsVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fraction Bars */}
    <g transform="translate(15, 15)">
      <text x="0" y="10" className="text-[10px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Unit Bar (1 Whole)</text>
      <rect x="0" y="16" width="220" height="22" rx="4" className="fill-[#EFF6FF] stroke-[#2563EB] dark:fill-[#2B2A56] dark:stroke-[#3B82F6]" strokeWidth="1.5" />
      <text x="110" y="31" textAnchor="middle" className="text-[10px] font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">1.0 (100%)</text>

      <text x="0" y="54" className="text-[10px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Halves (½ + ½)</text>
      <rect x="0" y="60" width="108" height="22" rx="4" className="fill-[#0F766E]/15 stroke-[#0F766E] dark:fill-[#2DD4BF]/15 dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
      <text x="54" y="75" textAnchor="middle" className="text-[10px] font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">½</text>
      <rect x="112" y="60" width="108" height="22" rx="4" className="fill-[#F4F7FC] stroke-[#CBD5E1] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="166" y="75" textAnchor="middle" className="text-[10px] font-medium fill-[#475569] dark:fill-[#A6A9C4]">½</text>

      <text x="0" y="98" className="text-[10px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Fourths (¼ segments)</text>
      <rect x="0" y="104" width="52" height="22" rx="3" className="fill-[#2563EB]/20 stroke-[#2563EB] dark:fill-[#3B82F6]/25 dark:stroke-[#3B82F6]" strokeWidth="1.2" />
      <text x="26" y="119" textAnchor="middle" className="text-[10px] font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">¼</text>
      <rect x="56" y="104" width="52" height="22" rx="3" className="fill-[#2563EB]/20 stroke-[#2563EB] dark:fill-[#3B82F6]/25 dark:stroke-[#3B82F6]" strokeWidth="1.2" />
      <text x="82" y="119" textAnchor="middle" className="text-[10px] font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">¼</text>
      <rect x="112" y="104" width="52" height="22" rx="3" className="fill-[#F4F7FC] stroke-[#CBD5E1] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.2" strokeDasharray="2 2" />
      <text x="138" y="119" textAnchor="middle" className="text-[10px] fill-[#475569] dark:fill-[#A6A9C4]">¼</text>
      <rect x="168" y="104" width="52" height="22" rx="3" className="fill-[#F4F7FC] stroke-[#CBD5E1] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.2" strokeDasharray="2 2" />
      <text x="194" y="119" textAnchor="middle" className="text-[10px] fill-[#475569] dark:fill-[#A6A9C4]">¼</text>
    </g>

    {/* Fraction Circle Model */}
    <g transform="translate(325, 75)">
      <circle cx="0" cy="0" r="48" className="fill-[#F4F7FC] stroke-[#CBD5E1] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.5" />
      {/* 3/4 slice shaded */}
      <path d="M 0 0 L 0 -48 A 48 48 0 1 1 -48 0 Z" className="fill-[#2563EB]/20 stroke-[#2563EB] dark:fill-[#3B82F6]/25 dark:stroke-[#3B82F6]" strokeWidth="1.5" />
      <path d="M 0 0 L -48 0 A 48 48 0 0 1 0 -48 Z" className="fill-[#0F766E]/25 stroke-[#0F766E] dark:fill-[#2DD4BF]/25 dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
      <line x1="-48" y1="0" x2="48" y2="0" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="1" strokeDasharray="2 2" />
      <line x1="0" y1="-48" x2="0" y2="48" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="1" strokeDasharray="2 2" />
      <text x="0" y="65" textAnchor="middle" className="text-[10px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">¾ Shaded Area</text>
    </g>

    {/* Number line with points 0, 1/4, 1/2, 3/4, 1 */}
    <g transform="translate(25, 175)">
      <line x1="0" y1="12" x2="370" y2="12" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" markerEnd="url(#arrow)" />
      {/* 0 */}
      <line x1="10" y1="5" x2="10" y2="19" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" />
      <text x="10" y="32" textAnchor="middle" className="text-[10px] font-medium fill-[#475569] dark:fill-[#A6A9C4]">0</text>
      {/* 1/4 */}
      <line x1="97" y1="7" x2="97" y2="17" className="stroke-[#475569] dark:stroke-[#A6A9C4]" strokeWidth="1" />
      <text x="97" y="32" textAnchor="middle" className="text-[10px] fill-[#475569] dark:fill-[#A6A9C4]">¼</text>
      {/* 1/2 */}
      <line x1="185" y1="5" x2="185" y2="19" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="2" />
      <circle cx="185" cy="12" r="3.5" className="fill-[#2563EB] dark:fill-[#3B82F6]" />
      <text x="185" y="32" textAnchor="middle" className="text-[10px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">½</text>
      {/* 3/4 */}
      <line x1="272" y1="7" x2="272" y2="17" className="stroke-[#475569] dark:stroke-[#A6A9C4]" strokeWidth="1" />
      <text x="272" y="32" textAnchor="middle" className="text-[10px] fill-[#475569] dark:fill-[#A6A9C4]">¾</text>
      {/* 1 */}
      <line x1="360" y1="5" x2="360" y2="19" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" />
      <text x="360" y="32" textAnchor="middle" className="text-[10px] font-medium fill-[#475569] dark:fill-[#A6A9C4]">1</text>
    </g>
  </svg>
);

// 2. Algebra Visual: Cartesian Coordinate plane with line y = mx + b, slope triangle
const AlgebraVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Grid Background */}
    <g opacity="0.35">
      {[40, 75, 110, 145, 180, 215, 250, 285].map((x) => (
        <line key={`vx-${x}`} x1={x} y1="15" x2={x} y2="195" className="stroke-[#CBD5E1] dark:stroke-[#2F2F52]" strokeWidth="0.8" />
      ))}
      {[35, 65, 95, 125, 155, 185].map((y) => (
        <line key={`hy-${y}`} x1="30" y1={y} x2="295" className="stroke-[#CBD5E1] dark:stroke-[#2F2F52]" strokeWidth="0.8" />
      ))}
    </g>

    {/* Axes */}
    <line x1="40" y1="125" x2="290" y2="125" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" />
    <line x1="162" y1="20" x2="162" y2="190" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" />
    <text x="286" y="120" className="text-[10px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">x</text>
    <text x="168" y="28" className="text-[10px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">y</text>

    {/* Linear function line y = 0.8x + 20 */}
    <line x1="60" y1="175" x2="265" y2="45" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="2.5" />
    
    {/* Slope Triangle */}
    <path d="M 162 108 L 225 108 L 225 70" className="stroke-[#0F766E] dark:stroke-[#2DD4BF]" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
    <text x="193" y="120" textAnchor="middle" className="text-[9px] font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">Δx = Run (3)</text>
    <text x="248" y="92" className="text-[9px] font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">Δy = Rise (2)</text>

    {/* Plotted Points */}
    <circle cx="162" cy="108" r="4" className="fill-[#2563EB] stroke-white dark:stroke-[#1B1B33]" strokeWidth="1.5" />
    <text x="145" y="102" className="text-[9px] font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">(0, b)</text>

    <circle cx="225" cy="70" r="4" className="fill-[#0F766E] stroke-white dark:stroke-[#1B1B33]" strokeWidth="1.5" />
    <text x="233" y="65" className="text-[9px] font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">(x₁, y₁)</text>

    {/* Equation Card Panel */}
    <g transform="translate(305, 30)">
      <rect x="0" y="0" width="105" height="150" rx="8" className="fill-white stroke-[#E2E8F0] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.2" />
      <text x="10" y="22" className="text-[10px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Slope-Intercept</text>
      <rect x="8" y="32" width="89" height="28" rx="4" className="fill-[#EFF6FF] dark:fill-[#2B2A56]" />
      <text x="52" y="50" textAnchor="middle" className="text-[12px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">y = mx + b</text>

      <text x="10" y="78" className="text-[9px] fill-[#475569] dark:text-[var(--text-muted)]">
        <tspan className="font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">m:</tspan> Slope (Rise/Run)
      </text>
      <text x="10" y="96" className="text-[9px] fill-[#475569] dark:text-[var(--text-muted)]">
        <tspan className="font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">b:</tspan> y-intercept
      </text>
      <text x="10" y="114" className="text-[9px] fill-[#475569] dark:text-[var(--text-muted)]">
        <tspan className="font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Rate:</tspan> Constant
      </text>
      <rect x="8" y="124" width="89" height="18" rx="3" className="fill-[#0F766E]/10 dark:fill-[#2DD4BF]/15" />
      <text x="52" y="136" textAnchor="middle" className="text-[9px] font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">m = ⅔ &gt; 0 (Upward)</text>
    </g>
  </svg>
);

// 3. Geometry Visual: Right triangle with hypotenuse, angle theta, and Pythagorean theorem
const GeometryVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Right Triangle */}
    <g transform="translate(45, 20)">
      <polygon points="30,150 190,150 190,30" className="fill-[#EFF6FF]/60 stroke-[#2563EB] dark:fill-[#2B2A56]/50 dark:stroke-[#3B82F6]" strokeWidth="2.5" />
      
      {/* Right angle square mark */}
      <rect x="175" y="135" width="15" height="15" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="1.2" fill="none" />
      
      {/* Labels */}
      <text x="110" y="168" textAnchor="middle" className="text-[11px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Base a = 4</text>
      <text x="215" y="95" className="text-[11px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Height b = 3</text>
      <text x="95" y="80" textAnchor="middle" className="text-[12px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Hypotenuse c = 5</text>
      
      {/* Angle Theta Arc */}
      <path d="M 65 150 A 35 35 0 0 0 58 135" className="stroke-[#0F766E] dark:stroke-[#2DD4BF]" strokeWidth="1.5" fill="none" />
      <text x="70" y="142" className="text-[10px] font-semibold fill-[#0F766E] dark:fill-[#2DD4BF]">θ</text>
    </g>

    {/* Theorem Proof Breakdown Card */}
    <g transform="translate(265, 25)">
      <rect x="0" y="0" width="135" height="165" rx="8" className="fill-white stroke-[#E2E8F0] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.2" />
      <text x="12" y="24" className="text-[11px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Pythagorean Theorem</text>
      
      <rect x="10" y="34" width="115" height="30" rx="4" className="fill-[#EFF6FF] dark:fill-[#2B2A56]" />
      <text x="67" y="54" textAnchor="middle" className="text-[13px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">a² + b² = c²</text>

      <text x="12" y="82" className="text-[10px] fill-[#475569] dark:text-[var(--text-muted)]">
        4² + 3² = 16 + 9 = <tspan className="font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">25</tspan>
      </text>
      <text x="12" y="100" className="text-[10px] fill-[#475569] dark:text-[var(--text-muted)]">
        c = √25 = <tspan className="font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">5 units</tspan>
      </text>

      <line x1="10" y1="112" x2="125" y2="112" className="stroke-[#E2E8F0] dark:stroke-[#2F2F52]" strokeWidth="1" />
      
      <text x="12" y="128" className="text-[9px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Trigonometric Ratios:</text>
      <text x="12" y="144" className="text-[9px] fill-[#475569] dark:text-[var(--text-muted)]">sin(θ) = 3/5 &bull; cos(θ) = 4/5</text>
      <text x="12" y="156" className="text-[9px] fill-[#475569] dark:text-[var(--text-muted)]">tan(θ) = 3/4 = 0.75</text>
    </g>
  </svg>
);

// 4. Science Visual: Ecosystem Energy Cycle & Trophic Pyramid
const ScienceVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Trophic Levels Pyramid */}
    <g transform="translate(30, 20)">
      {/* Apex Predators */}
      <polygon points="120,20 85,55 155,55" className="fill-[#0F766E]/30 stroke-[#0F766E] dark:fill-[#2DD4BF]/30 dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
      <text x="120" y="44" textAnchor="middle" className="text-[9px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Apex (0.1% Energy)</text>

      {/* Secondary Consumers */}
      <polygon points="85,58 60,95 180,95 155,58" className="fill-[#2563EB]/25 stroke-[#2563EB] dark:fill-[#3B82F6]/30 dark:stroke-[#3B82F6]" strokeWidth="1.5" />
      <text x="120" y="80" textAnchor="middle" className="text-[9px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">Secondary Consumers (1%)</text>

      {/* Primary Consumers (Herbivores) */}
      <polygon points="60,98 35,135 205,135 180,98" className="fill-[#EFF6FF] stroke-[#2563EB]/60 dark:fill-[#2B2A56] dark:stroke-[#3B82F6]/60" strokeWidth="1.5" />
      <text x="120" y="120" textAnchor="middle" className="text-[9px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Primary Consumers (10%)</text>

      {/* Primary Producers (Plants/Sun) */}
      <polygon points="35,138 10,175 230,175 205,138" className="fill-[#0F766E]/15 stroke-[#0F766E] dark:fill-[#2DD4BF]/15 dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
      <text x="120" y="160" textAnchor="middle" className="text-[9px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Primary Producers (100% Photosynthesis)</text>
    </g>

    {/* Nutrient Recycling & Energy Transfer Callout */}
    <g transform="translate(270, 25)">
      <rect x="0" y="0" width="130" height="155" rx="8" className="fill-white stroke-[#E2E8F0] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.2" />
      <text x="12" y="24" className="text-[10px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Trophic Transfer Rule</text>
      
      <rect x="8" y="32" width="114" height="32" rx="4" className="fill-[#0F766E]/10 dark:fill-[#2DD4BF]/15" />
      <text x="65" y="48" textAnchor="middle" className="text-[11px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">10% Energy Law</text>
      <text x="65" y="58" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">90% lost to metabolic heat</text>

      <text x="12" y="80" className="text-[9px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">System Equilibrium:</text>
      <text x="12" y="94" className="text-[8.5px] fill-[#475569] dark:text-[var(--text-muted)]">&bull; Solar radiant input</text>
      <text x="12" y="107" className="text-[8.5px] fill-[#475569] dark:text-[var(--text-muted)]">&bull; Carbon-oxygen exchange</text>
      <text x="12" y="120" className="text-[8.5px] fill-[#475569] dark:text-[var(--text-muted)]">&bull; Decomposer nutrient return</text>

      <rect x="8" y="128" width="114" height="20" rx="3" className="fill-[#EFF6FF] dark:fill-[#2B2A56]" />
      <text x="65" y="142" textAnchor="middle" className="text-[8.5px] font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">Closed Nutrient Loop</text>
    </g>
  </svg>
);

// 5. Computer Science Visual: Algorithm Logic Flowchart
const ComputerScienceVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Start Node */}
    <rect x="25" y="85" width="60" height="28" rx="14" className="fill-[#2563EB] dark:fill-[#3B82F6]" />
    <text x="55" y="103" textAnchor="middle" className="text-[10px] font-bold fill-white">Start</text>

    {/* Arrow */}
    <line x1="85" y1="99" x2="115" y2="99" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" />

    {/* Decision Diamond */}
    <polygon points="155,70 195,99 155,128 115,99" className="fill-[#EFF6FF] stroke-[#2563EB] dark:fill-[#2B2A56] dark:stroke-[#3B82F6]" strokeWidth="1.5" />
    <text x="155" y="96" textAnchor="middle" className="text-[9px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Condition</text>
    <text x="155" y="107" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">x &gt; target?</text>

    {/* True Branch (Right) */}
    <line x1="195" y1="99" x2="235" y2="99" className="stroke-[#0F766E] dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
    <text x="210" y="93" className="text-[8px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">True</text>

    {/* Process Box */}
    <rect x="235" y="85" width="75" height="28" rx="4" className="fill-[#0F766E]/15 stroke-[#0F766E] dark:fill-[#2DD4BF]/20 dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
    <text x="272" y="103" textAnchor="middle" className="text-[9px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Execute Step</text>

    {/* Arrow to End */}
    <line x1="310" y1="99" x2="345" y2="99" className="stroke-[#0F172A] dark:stroke-[#F4F4FD]" strokeWidth="1.5" />
    <rect x="345" y="85" width="55" height="28" rx="14" className="fill-[#0F172A] dark:fill-[#F4F4FD]" />
    <text x="372" y="103" textAnchor="middle" className="text-[10px] font-bold fill-white dark:fill-[#0B1220]">Done</text>

    {/* False Branch (Loop Back Down) */}
    <line x1="155" y1="128" x2="155" y2="165" className="stroke-[#475569] dark:stroke-[#A6A9C4]" strokeWidth="1.5" />
    <text x="162" y="148" className="text-[8px] font-semibold fill-[#475569] dark:fill-[#A6A9C4]">False</text>
    <line x1="155" y1="165" x2="55" y2="165" className="stroke-[#475569] dark:stroke-[#A6A9C4]" strokeWidth="1.5" />
    <line x1="55" y1="165" x2="55" y2="115" className="stroke-[#475569] dark:stroke-[#A6A9C4]" strokeWidth="1.5" />

    {/* Terminal Code Snippet Banner */}
    <g transform="translate(70, 20)">
      <rect x="0" y="0" width="280" height="35" rx="6" className="fill-[#1B1B33] stroke-[#2F2F52]" strokeWidth="1" />
      <text x="12" y="18" className="text-[9px] font-mono fill-[#2DD4BF]">while condition:</text>
      <text x="24" y="28" className="text-[9px] font-mono fill-[#3B82F6]">execute_step() &bull; state.update()</text>
    </g>
  </svg>
);

// 6. History Visual: Chronological Context Timeline
const HistoryVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Central Axis */}
    <line x1="30" y1="110" x2="390" y2="110" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="2.5" />

    {/* Milestone 1 (Precedent) */}
    <g transform="translate(60, 110)">
      <circle cx="0" cy="0" r="6" className="fill-white stroke-[#2563EB] dark:fill-[#1B1B33] dark:stroke-[#3B82F6]" strokeWidth="2" />
      <line x1="0" y1="-8" x2="0" y2="-45" className="stroke-[#CBD5E1] dark:stroke-[#2F2F52]" strokeWidth="1.2" strokeDasharray="2 2" />
      <rect x="-45" y="-72" width="90" height="26" rx="4" className="fill-[#EFF6FF] stroke-[#2563EB]/30 dark:fill-[#2B2A56] dark:stroke-[#3B82F6]/40" />
      <text x="0" y="-55" textAnchor="middle" className="text-[9px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">Phase I: Catalyst</text>
      <text x="0" y="22" textAnchor="middle" className="text-[9px] font-medium fill-[#475569] dark:fill-[#A6A9C4]">Root Causes</text>
    </g>

    {/* Milestone 2 (Inflection Point) */}
    <g transform="translate(200, 110)">
      <circle cx="0" cy="0" r="8" className="fill-[#0F766E] stroke-white dark:stroke-[#1B1B33]" strokeWidth="2" />
      <line x1="0" y1="10" x2="0" y2="45" className="stroke-[#0F766E] dark:stroke-[#2DD4BF]" strokeWidth="1.2" />
      <rect x="-55" y="45" width="110" height="28" rx="4" className="fill-[#0F766E]/15 stroke-[#0F766E] dark:fill-[#2DD4BF]/20 dark:stroke-[#2DD4BF]" />
      <text x="0" y="62" textAnchor="middle" className="text-[9px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Turning Point</text>
      <text x="0" y="-16" textAnchor="middle" className="text-[10px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Critical Event</text>
    </g>

    {/* Milestone 3 (Consequence / Resolution) */}
    <g transform="translate(340, 110)">
      <circle cx="0" cy="0" r="6" className="fill-white stroke-[#2563EB] dark:fill-[#1B1B33] dark:stroke-[#3B82F6]" strokeWidth="2" />
      <line x1="0" y1="-8" x2="0" y2="-45" className="stroke-[#CBD5E1] dark:stroke-[#2F2F52]" strokeWidth="1.2" strokeDasharray="2 2" />
      <rect x="-50" y="-72" width="100" height="26" rx="4" className="fill-[#EFF6FF] stroke-[#2563EB]/30 dark:fill-[#2B2A56] dark:stroke-[#3B82F6]/40" />
      <text x="0" y="-55" textAnchor="middle" className="text-[9px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">Legacy & Impact</text>
      <text x="0" y="22" textAnchor="middle" className="text-[9px] font-medium fill-[#475569] dark:fill-[#A6A9C4]">Downstream Laws</text>
    </g>
  </svg>
);

// 7. Literature Visual: Narrative Mountain Arc & Rhetorical Triangle
const LiteratureVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Plot Mountain Arc */}
    <path d="M 25 160 L 100 135 L 195 50 L 290 135 L 390 160" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="2.5" fill="none" />

    {/* Nodes along the narrative */}
    {/* 1. Exposition */}
    <circle cx="25" cy="160" r="4" className="fill-[#2563EB] dark:fill-[#3B82F6]" />
    <text x="25" y="180" textAnchor="middle" className="text-[8.5px] font-semibold fill-[#475569] dark:fill-[#A6A9C4]">Exposition</text>

    {/* 2. Rising Action */}
    <circle cx="100" cy="135" r="4" className="fill-[#2563EB] dark:fill-[#3B82F6]" />
    <text x="95" y="122" textAnchor="middle" className="text-[8.5px] font-semibold fill-[#475569] dark:fill-[#A6A9C4]">Rising Action</text>

    {/* 3. Climax */}
    <circle cx="195" cy="50" r="6" className="fill-[#0F766E] stroke-white dark:stroke-[#1B1B33]" strokeWidth="2" />
    <rect x="160" y="16" width="70" height="22" rx="4" className="fill-[#0F766E]/15 stroke-[#0F766E] dark:fill-[#2DD4BF]/20 dark:stroke-[#2DD4BF]" />
    <text x="195" y="30" textAnchor="middle" className="text-[9.5px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Climax (Apex)</text>

    {/* 4. Falling Action */}
    <circle cx="290" cy="135" r="4" className="fill-[#2563EB] dark:fill-[#3B82F6]" />
    <text x="295" y="122" textAnchor="middle" className="text-[8.5px] font-semibold fill-[#475569] dark:fill-[#A6A9C4]">Falling Action</text>

    {/* 5. Resolution */}
    <circle cx="390" cy="160" r="4" className="fill-[#2563EB] dark:fill-[#3B82F6]" />
    <text x="385" y="180" textAnchor="middle" className="text-[8.5px] font-semibold fill-[#475569] dark:fill-[#A6A9C4]">Resolution</text>

    {/* Rhetorical Triangle Mini Inset */}
    <g transform="translate(145, 120)">
      <polygon points="50,0 15,45 85,45" className="fill-[#EFF6FF] stroke-[#2563EB]/40 dark:fill-[#2B2A56] dark:stroke-[#3B82F6]/40" strokeWidth="1.2" />
      <text x="50" y="14" textAnchor="middle" className="text-[7.5px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">Logos</text>
      <text x="25" y="40" textAnchor="middle" className="text-[7.5px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Ethos</text>
      <text x="75" y="40" textAnchor="middle" className="text-[7.5px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">Pathos</text>
    </g>
  </svg>
);

// 8. General Visual: Backward Design & Inquiry Roadmap (Fallback)
const GeneralVisual: React.FC = () => (
  <svg viewBox="0 0 420 220" className="w-full h-full max-w-full max-h-full select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 3 Pillars of Backward Design */}
    <g transform="translate(25, 45)">
      {/* Pillar 1: Desired Results */}
      <rect x="0" y="0" width="110" height="95" rx="8" className="fill-[#EFF6FF] stroke-[#2563EB] dark:fill-[#2B2A56] dark:stroke-[#3B82F6]" strokeWidth="1.5" />
      <text x="55" y="24" textAnchor="middle" className="text-[10px] font-bold fill-[#2563EB] dark:fill-[#3B82F6]">Stage 1</text>
      <text x="55" y="42" textAnchor="middle" className="text-[9px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Desired Results</text>
      <text x="55" y="62" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">Essential Questions</text>
      <text x="55" y="76" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">Core Standards</text>

      {/* Arrow 1 */}
      <line x1="110" y1="47" x2="130" y2="47" className="stroke-[#2563EB] dark:stroke-[#3B82F6]" strokeWidth="2" />

      {/* Pillar 2: Evidence */}
      <rect x="130" y="0" width="110" height="95" rx="8" className="fill-[#0F766E]/15 stroke-[#0F766E] dark:fill-[#2DD4BF]/20 dark:stroke-[#2DD4BF]" strokeWidth="1.5" />
      <text x="185" y="24" textAnchor="middle" className="text-[10px] font-bold fill-[#0F766E] dark:fill-[#2DD4BF]">Stage 2</text>
      <text x="185" y="42" textAnchor="middle" className="text-[9px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Assessment Evidence</text>
      <text x="185" y="62" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">Formative Checkpoints</text>
      <text x="185" y="76" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">Exit Slips & Proof</text>

      {/* Arrow 2 */}
      <line x1="240" y1="47" x2="260" y2="47" className="stroke-[#0F766E] dark:stroke-[#2DD4BF]" strokeWidth="2" />

      {/* Pillar 3: Learning Plan */}
      <rect x="260" y="0" width="110" height="95" rx="8" className="fill-white stroke-[#E2E8F0] dark:fill-[#232342] dark:stroke-[#2F2F52]" strokeWidth="1.5" />
      <text x="315" y="24" textAnchor="middle" className="text-[10px] font-bold fill-[#0F172A] dark:fill-[#F4F4FD]">Stage 3</text>
      <text x="315" y="42" textAnchor="middle" className="text-[9px] font-semibold fill-[#0F172A] dark:fill-[#F4F4FD]">Learning Flow</text>
      <text x="315" y="62" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">Instructional Sequence</text>
      <text x="315" y="76" textAnchor="middle" className="text-[8px] fill-[#475569] dark:text-[var(--text-muted)]">Tiered Scaffolding</text>
    </g>

    {/* Bottom Inquiry Loop */}
    <g transform="translate(130, 165)">
      <rect x="0" y="0" width="160" height="24" rx="12" className="fill-[#EFF6FF] dark:fill-[#2B2A56]" />
      <text x="80" y="15" textAnchor="middle" className="text-[9px] font-semibold fill-[#2563EB] dark:fill-[#3B82F6]">Continuous Formative Loop</text>
    </g>
  </svg>
);
