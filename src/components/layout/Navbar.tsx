import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  FolderKanban, 
  Settings as SettingsIcon, 
  PlusCircle, 
  Sun, 
  Moon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'wizard' | 'workspace' | 'library';
  onNavigate: (view: 'dashboard' | 'wizard' | 'library') => void;
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
    <header className="sticky top-0 z-40 w-full border-b border-navy-200/80 bg-white/90 backdrop-blur-md dark:border-navy-800 dark:bg-navy-900/90 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => onNavigate('dashboard')} 
            className="group flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-sm group-hover:from-brand-500 group-hover:to-brand-600 transition-all">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white">
                  LessonCraft
                </span>
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800 dark:bg-brand-900/60 dark:text-brand-300">
                  AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-navy-500 dark:text-navy-400">
                Instructional Curriculum Planner
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300'
                  : 'text-navy-600 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('library')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === 'library'
                  ? 'bg-brand-50 text-brand-700 dark:bg-navy-800 dark:text-brand-300'
                  : 'text-navy-600 hover:text-navy-900 dark:text-navy-300 dark:hover:text-white hover:bg-navy-50 dark:hover:bg-navy-800/60'
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              Saved Plans
              {planCount > 0 && (
                <span className="ml-1 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
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
            title={liveAiAvailable ? "Connected to Google Gemini Live API" : "Running in High-Fidelity Pedagogical Demo Mode (Click to configure API Key)"}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors border ${
              liveAiAvailable 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {liveAiAvailable ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Live Gemini AI</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Demo Mode (Active)</span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-navy-500 hover:text-navy-900 hover:bg-navy-100 dark:text-navy-400 dark:hover:text-white dark:hover:bg-navy-800 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-2 rounded-lg text-navy-500 hover:text-navy-900 hover:bg-navy-100 dark:text-navy-400 dark:hover:text-white dark:hover:bg-navy-800 transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>

          {/* Primary CTA */}
          <button
            onClick={() => onNavigate('wizard')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 active:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
