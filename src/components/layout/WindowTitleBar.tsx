import { Minus, X } from 'lucide-react';

interface WindowTitleBarProps {
  onMinimize: () => void;
  onClose: () => void;
}

export function WindowTitleBar({ onMinimize, onClose }: WindowTitleBarProps) {
  return (
    <div className="window-titlebar">
      <div className="window-titlebar__brand">
        <span className="window-titlebar__brand-mark" />
        Fixnet
      </div>
      <div className="window-titlebar__actions">
        <button className="window-titlebar__btn" onClick={onMinimize} aria-label="Minimize">
          <Minus size={14} />
        </button>
        <button
          className="window-titlebar__btn window-titlebar__btn--close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
