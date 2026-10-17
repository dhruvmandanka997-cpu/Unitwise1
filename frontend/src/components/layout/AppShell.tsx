import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  FolderKanban, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Search, 
  User, 
  BookMarked,
  Cpu
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../../config/brand';

interface AppShellProps {
  currentView: 'dashboard' | 'wizard' | 'workspace' | 'library';
  activePlanTitle?: string;
  onNavigate: (view: 'dashboard' | 'wizard' | 'workspace' | 'library') => void;
  onOpenSettings: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  liveAiAvailable: boolean;
  planCount: number;
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  activePlanTitle,
  onNavigate,
  onOpenSettings,
  isDark,
  onToggleTheme,
  liveAiAvailable,
  planCount,
  children,
  searchQuery = '',
  onSearchChange,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Canonical 5-page navigation matching user specifications
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
      badge: null,
      isActive: currentView === 'dashboard',
      onClick: () => onNavigate('dashboard'),
    },
    {
      id: 'wizard',
      label: 'AI Tutor',
      icon: Sparkles,
      badge: 'AI',
      isActive: currentView === 'wizard',
      onClick: () => onNavigate('wizard'),
    },
    {
      id: 'library',
      label: 'My Learning',
      icon: BookOpen,
      badge: planCount > 0 ? planCount : null,
      isActive: currentView === 'library',
      onClick: () => onNavigate('library'),
    },
    {
      id: 'workspace',
      label: 'Practice',
      icon: FolderKanban,
      badge: activePlanTitle ? 'Active' : null,
      isActive: currentView === 'workspace',
      onClick: () => onNavigate('workspace'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null,
      isActive: false,
      onClick: () => onOpenSettings(),
    },
  ];

  const handleMobileNav = (item: typeof navigationItems[0]) => {
    item.onClick();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col antialiased transition-colors duration-200">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[var(--text)]/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg)] border-r border-[var(--border)] shadow-[var(--shadow-raised)] transform transition-transform duration-250 ease-out lg:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-18 items-center justify-between px-5 border-b border-[var(--border)]">
          <BrandLogo size="md" />
          <button 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] shadow-[var(--shadow-raised-sm)] active:shadow-[var(--shadow-inset)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;
            return (
              <button
                key={item.id}
                onClick={() => handleMobileNav(item)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-full text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all ${
                  isActive
                    ? 'bg-[var(--lavender-soft)] text-[var(--primary)] font-bold shadow-[var(--shadow-inset)] border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/70 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full transition-all ${
                    isActive 
                      ? 'bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-inset)]' 
                      : 'bg-[var(--lavender-soft)] text-[var(--accent)] shadow-[var(--shadow-raised-sm)] border border-[var(--border)]'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs' 
                      : 'bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={() => {
              onOpenSettings();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] text-xs font-semibold text-[var(--text)] hover:shadow-[var(--shadow-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
          >
            <div className="p-2 rounded-full bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-inset)]">
              <SettingsIcon className="h-4 w-4" />
            </div>
            <span>Profile & Settings</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* ================= DESKTOP LEFT SIDEBAR ================= */}
        <aside 
          className={`hidden lg:flex flex-col bg-[var(--bg)] border-r border-[var(--border)] transition-all duration-200 z-30 sticky top-0 h-screen ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand header */}
          <div className="flex h-18 items-center justify-between px-4 border-b border-[var(--border)]">
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="flex items-center overflow-hidden text-left focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-2xl p-1"
              aria-label={`${BRAND.name} Home`}
            >
              <BrandLogo size="md" iconOnly={sidebarCollapsed} />
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] shadow-[var(--shadow-raised-sm)] hover:text-[var(--text)] hover:shadow-[var(--shadow-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} py-2.5 rounded-full text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all ${
                    isActive
                      ? 'bg-[var(--lavender-soft)] text-[var(--primary)] font-bold shadow-[var(--shadow-inset)] border border-[var(--border)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/70 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`p-2 rounded-full flex-shrink-0 transition-all ${
                      isActive 
                        ? 'bg-[var(--lavender-soft)] text-[var(--primary)] shadow-[var(--shadow-inset)]' 
                        : 'bg-[var(--lavender-soft)] text-[var(--accent)] shadow-[var(--shadow-raised-sm)] border border-[var(--border)]'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!sidebarCollapsed && <span className="truncate font-semibold">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs' 
                        : 'bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Soft Neumorphic Pedagogical Quote Card */}
          {!sidebarCollapsed && (
            <div className="p-4 mx-3 mb-4 rounded-[24px] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] text-xs">
              <div className="flex items-center gap-2 font-bold text-[var(--text)] mb-1.5">
                <div className="p-1.5 rounded-lg bg-[var(--lavender-soft)] text-[var(--accent)]">
                  <BookMarked className="h-3.5 w-3.5" />
                </div>
                <span>{BRAND.pedagogyTitle}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">
                “Education is the kindling of a flame, not the filling of a vessel.”
              </p>
              <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--accent)] font-bold">
                <span>Adaptive AI Studio</span>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
              </div>
            </div>
          )}

          {/* Bottom Profile & Settings Link */}
          <div className="p-3 border-t border-[var(--border)]">
            <button
              onClick={onOpenSettings}
              title={sidebarCollapsed ? "Profile & Settings" : undefined}
              aria-label="Profile & Settings"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} gap-2.5 px-3 py-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] text-xs font-semibold text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all`}
            >
              <div className="p-1.5 rounded-xl bg-[var(--lavender-soft)] text-[var(--accent)] flex-shrink-0">
                <SettingsIcon className="h-4 w-4" />
              </div>
              {!sidebarCollapsed && <span>Profile & Settings</span>}
            </button>
          </div>
        </aside>

        {/* Content Area & Top Bar */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ================= TOP NAVIGATION BAR ================= */}
          <header className="sticky top-0 z-30 h-18 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors">
            {/* Left: Mobile Toggle & Search Field */}
            <div className="flex items-center gap-3 flex-1 max-w-lg min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] shadow-[var(--shadow-raised-sm)] hover:text-[var(--text)] lg:hidden shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
                aria-label="Open mobile navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Connected Search Field */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    if (onSearchChange) onSearchChange(e.target.value);
                  }}
                  placeholder="Search lessons, topics, curriculum frameworks..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] shadow-[var(--shadow-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                />
              </div>
            </div>

            {/* Right Controls: AI Status, Theme Toggle, Profile Menu */}
            <div className="flex items-center gap-3 shrink-0">
              {/* AI Status Badge */}
              <button 
                onClick={onOpenSettings}
                title={liveAiAvailable ? "Connected to Google Gemini Live API" : "Pedagogical Backward-Design Engine Active"}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--lavender-soft)] text-[var(--primary)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all"
              >
                {liveAiAvailable ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                    <span>Gemini Live</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>{BRAND.shortName}</span>
                  </>
                )}
              </button>

              {/* Theme Toggle Button - Soft Neumorphic Button */}
              <button
                onClick={onToggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-all active:shadow-[var(--shadow-inset)]"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-400 animate-spin-once" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--primary)]" />
                )}
              </button>

              {/* User Avatar & Educator Profile Menu */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] transition-all focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
                  aria-label="Educator profile menu"
                >
                  <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-bold text-xs shadow-[var(--shadow-primary)]">
                    EV
                  </div>
                  <div className="hidden sm:block text-left pr-1.5">
                    <div className="text-xs font-bold text-[var(--text)]">
                      Dr. E. Vance
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] -mt-0.5 font-medium">
                      Educator
                    </div>
                  </div>
                </button>

                {/* Profile Menu Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-14 z-40 w-60 rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-raised)] animate-fadeIn">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <p className="text-xs font-bold text-[var(--text)]">
                        Dr. Elena Vance
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">
                        STEM & Instructional Design
                      </p>
                    </div>

                    <div className="py-1.5 space-y-1">
                      <button
                        onClick={() => {
                          onOpenSettings();
                          setProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Educator Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenSettings();
                          setProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors"
                      >
                        <BookMarked className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Curriculum Standards</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenSettings();
                          setProfileDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--lavender-soft)] hover:text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors"
                      >
                        <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>AI Engine Credentials</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

          {/* Soft Neumorphic Footer */}
          <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-6 px-4 sm:px-8 transition-colors">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)] font-medium">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text)]">{BRAND.name}</span>
                <span>&bull;</span>
                <span>{BRAND.tagline}</span>
              </div>
              <div>
                Universal Design for Learning (UDL) &bull; Backward Design &bull; Bloom’s Verbs
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
