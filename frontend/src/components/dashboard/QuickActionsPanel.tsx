import React from 'react';
import { PlusCircle, Compass, FolderKanban, Settings as SettingsIcon } from 'lucide-react';

interface QuickActionsPanelProps {
  onOpenWizard: () => void;
  onBrowseTemplates: () => void;
  onViewLibrary: () => void;
  onOpenSettings: () => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onOpenWizard,
  onBrowseTemplates,
  onViewLibrary,
  onOpenSettings,
}) => {
  const actions = [
    {
      title: 'Generate New Plan',
      description: 'AI-guided multi-week unit creation',
      icon: PlusCircle,
      onClick: onOpenWizard,
    },
    {
      title: 'Browse Blueprints',
      description: 'Pre-configured curriculum starters',
      icon: Compass,
      onClick: onBrowseTemplates,
    },
    {
      title: 'View Saved Plans',
      description: 'Manage, adapt & export learning archive',
      icon: FolderKanban,
      onClick: onViewLibrary,
    },
    {
      title: 'Platform Settings',
      description: 'AI model & teaching defaults',
      icon: SettingsIcon,
      onClick: onOpenSettings,
    },
  ];

  return (
    <div className="bg-white dark:bg-[var(--surface)] border border-[var(--border)] dark:border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-card transition-all">
      <h3 className="text-sm font-bold text-[var(--text)] dark:text-[var(--text)]">
        Quick Actions & Tools
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              onClick={act.onClick}
              className="flex items-start gap-3.5 p-3.5 text-left rounded-xl border border-[var(--border)] dark:border-[var(--border)] bg-white dark:bg-[var(--surface)] hover:bg-[var(--lavender-soft)]/40 dark:hover:bg-[var(--surface)] hover:border-[var(--primary)]/40 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(73,56,200,0.08)] transition-all group"
            >
              {/* Pale lavender rounded-square container behind icon */}
              <div className="mt-0.5 p-2 rounded-xl bg-[var(--lavender-soft)] dark:bg-[var(--lavender-soft)] text-[var(--primary)] dark:text-[var(--accent)] group-hover:scale-105 transition-transform shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--text)] dark:text-[var(--text)] group-hover:text-[var(--primary)] dark:group-hover:text-[var(--accent)] transition-colors truncate">
                  {act.title}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] dark:text-[var(--text-muted)] leading-relaxed truncate mt-0.5">
                  {act.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
