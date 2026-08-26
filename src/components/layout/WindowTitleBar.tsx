import { Minus, X, CircleHelp } from 'lucide-react';

interface WindowTitleBarProps {
  section?: string;
  onMinimize: () => void;
  onClose: () => void;
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
        <CircleHelp size={16} />
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
