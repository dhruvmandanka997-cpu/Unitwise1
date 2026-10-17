import React from 'react';
import { Sparkles } from 'lucide-react';
import { BRAND } from '../../config/brand';

interface BrandLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
  iconOnly = false,
}) => {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-10 w-10';
  const iconGlyph = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const textClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex ${iconSize} items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] shadow-[var(--shadow-primary)] flex-shrink-0 transition-transform group-hover:scale-105`}
        aria-hidden="true"
      >
        <Sparkles className={`${iconGlyph} text-white`} />
      </div>

      {!iconOnly && (
        <div className="truncate text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`${textClass} font-extrabold tracking-tight font-sans`}>
              <span className="text-[var(--text)]">Unit</span>
              <span className="text-[var(--primary)]">Wise</span>
            </span>
          </div>
          {showTagline && (
            <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1 truncate">
              {BRAND.tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
