import React from 'react';
import { 
  Sparkles, 
  FolderKanban, 
  Settings as SettingsIcon, 
  PlusCircle, 
  Sun, 
  Moon,
  CheckCircle2
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../../config/brand';

interface NavbarProps {
  currentView: 'dashboard' | 'wizard' | 'workspace' | 'library';
  onNavigate: (view: 'dashboard' | 'wizard' | 'workspace' | 'library') => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  liveAiAvailable: boolean;
  planCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  isDark,
  onToggleTheme,
  liveAiAvailable,
  planCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onNavigate('dashboard')} 
            className="group flex items-center text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-2xl p-1"
            aria-label={`${BRAND.name} Home`}
          >
            <BrandLogo />
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-4 py-2 text-xs font-semibold rounded-full focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all ${
                currentView === 'dashboard'
                  ? 'bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-inset)] border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/80'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('wizard')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all ${
                currentView === 'wizard'
                  ? 'bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-inset)] border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/80'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Tutor
            </button>
            <button
              onClick={() => onNavigate('library')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all ${
                currentView === 'library'
                  ? 'bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-inset)] border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/80'
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              My Learning
              {planCount > 0 && (
                <span className="ml-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] px-2 py-0.2 text-[10px] font-bold">
                  {planCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Status Pill */}
          <div 
            onClick={onOpenSettings}
            title={liveAiAvailable ? "Connected to Google Gemini Live API" : "Interactive Pedagogical Mode"}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border border-[var(--border)] bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-raised-sm)]"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
            <span>{liveAiAvailable ? 'Live Gemini AI' : BRAND.studioName}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all active:shadow-[var(--shadow-inset)]"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[var(--primary)]" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => onNavigate('wizard')}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2.5 text-xs font-semibold text-[var(--on-primary)] shadow-[var(--shadow-primary)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[var(--shadow-inset)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
