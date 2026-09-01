import { Minus, X } from 'lucide-react';

interface WindowTitleBarProps {
  section?: string;
  onMinimize: () => void;
  onClose: () => void;
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.3" />
      <text x="8" y="11.4" textAnchor="middle" fontFamily="var(--font)" fontSize="9.5" fill="currentColor">
        ?
      </text>
    </svg>
  );
}

export function WindowTitleBar({ section, onMinimize, onClose }: WindowTitleBarProps) {
  return (
    <div className="window-titlebar">
      <div className="window-titlebar__brand">
        <span>Fixnet</span>
        {section && (
          <>
            <span className="window-titlebar__brand-sep">/</span>
            <span className="window-titlebar__brand-section">{section}</span>
          </>
        )}
      </div>
      <div className="window-titlebar__help">
        <HelpIcon />
        <span>Get help</span>
      </div>
      <div className="window-titlebar__actions">
        <button className="window-titlebar__btn" onClick={onMinimize} aria-label="Minimize">
          <Minus size={16} />
        </button>
        <button
          className="window-titlebar__btn window-titlebar__btn--close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <div className="window-titlebar__divider" />
    </div>
  );
}
