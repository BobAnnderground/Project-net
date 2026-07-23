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
          <div className="service-card__check-icon">
            <Check size={10} strokeWidth={3} />
          </div>
        </div>
      )}

      <div className="service-card__header">
        <div className="service-card__icon-swatch">
          <ServiceIcon name={name} fallback={icon} size={26} />
        </div>
        <span className="service-card__name">{name}</span>
      </div>

      <div className="service-card__bottom-row">
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
        <button
          className="service-card__settings-btn"
          onClick={handleSettingsClick}
          tabIndex={-1}
          aria-label="Settings"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
