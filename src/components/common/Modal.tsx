import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({ title, onClose, children, footer, size = 'md' }: ModalProps) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className={`modal${size === 'lg' ? ' modal--lg' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
