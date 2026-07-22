import type { LucideIcon } from 'lucide-react';
import { SlidersHorizontal, Check } from 'lucide-react';
import clsx from 'clsx';
import { ServiceIcon } from './ServiceIcon';

interface ServiceCardProps {
  icon: string;
  name: string;
  chips: { icon: LucideIcon; label: string }[];
  selected: boolean;
  onClick: () => void;
  onSettingsClick: () => void;
}

export function ServiceCard({ icon, name, chips, selected, onClick, onSettingsClick }: ServiceCardProps) {
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
        <div className="service-card__icon-swatch">
          <ServiceIcon name={name} fallback={icon} size={18} />
        </div>
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
