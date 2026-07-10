import type { LucideIcon } from 'lucide-react';
import { SlidersHorizontal, Check, X } from 'lucide-react';
import clsx from 'clsx';

interface ServiceCardProps {
  icon: string;
  name: string;
  chips: { icon: LucideIcon; label: string }[];
  selected: boolean;
  onClick: () => void;
  onSettingsClick: () => void;
  onRemoveClick?: () => void;
}

export function ServiceCard({ icon, name, chips, selected, onClick, onSettingsClick, onRemoveClick }: ServiceCardProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  function handleSettingsClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onSettingsClick();
  }

  function handleRemoveClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onRemoveClick?.();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={clsx('service-card', { 'service-card--selected': selected })}
    >
      {selected && (
        <div className="service-card__check">
          <Check size={10} color="var(--on-accent)" />
        </div>
      )}

      <div className="service-card__header">
        <div className="service-card__icon-swatch">{icon}</div>
        <span className="service-card__name">{name}</span>
        <div className="service-card__actions">
          <button
            className="service-card__settings-btn"
            onClick={handleSettingsClick}
            tabIndex={-1}
            aria-label="Settings"
          >
            <SlidersHorizontal size={14} />
          </button>
          {onRemoveClick && (
            <button
              className="service-card__remove-btn"
              onClick={handleRemoveClick}
              tabIndex={-1}
              aria-label="Remove from preset"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="service-card__chips">
        {chips.map((chip, i) => {
          const Icon = chip.icon;
          return (
            <span key={i} className="service-chip">
              <Icon size={12} className="service-chip__icon" />
              <span className="service-chip__label">{chip.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
