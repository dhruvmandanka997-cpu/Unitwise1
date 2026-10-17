import React from 'react';
import { PlusCircle, Compass, FolderKanban, BookMarked, Zap } from 'lucide-react';

interface QuickActionsCardProps {
  onOpenWizard: () => void;
  onBrowseTemplates: () => void;
  onViewLibrary: () => void;
  onManageSubjects: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onOpenWizard,
  onBrowseTemplates,
  onViewLibrary,
  onManageSubjects,
}) => {
  const actions = [
    {
      id: 'generate',
      title: 'Generate New Plan',
      desc: 'AI curriculum builder',
      icon: PlusCircle,
      onClick: onOpenWizard,
    },
    {
      id: 'templates',
      title: 'Browse Templates',
      desc: 'Pre-designed blueprints',
      icon: Compass,
      onClick: onBrowseTemplates,
    },
    {
      id: 'saved',
      title: 'View Saved Plans',
      desc: 'All instructional units',
      icon: FolderKanban,
      onClick: onViewLibrary,
    },
    {
      id: 'subjects',
      title: 'Manage Subjects',
      desc: 'Curriculum frameworks',
      icon: BookMarked,
      onClick: onManageSubjects,
    },
  ];

  return (
    <div className="neu-card p-5 space-y-3.5">
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <div className="neu-icon-box">
          <Zap className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">
            Quick Actions
          </h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Educator tools & shortcuts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="flex flex-col items-start p-3.5 rounded-[16px] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-raised-sm)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5 text-left transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <div className="neu-icon-box mb-2 group-hover:scale-105 transition-transform">
                <Icon className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors leading-tight">
                {act.title}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                {act.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
