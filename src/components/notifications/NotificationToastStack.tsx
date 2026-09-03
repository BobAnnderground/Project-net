import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { NoticeCard } from './NoticeCard';

export function NotificationToastStack() {
  const notifications = useStore((s) => s.notifications);
  const dismissToast = useStore((s) => s.dismissToast);
  const dismissAllToasts = useStore((s) => s.dismissAllToasts);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = notifications.filter((n) => !n.toastDismissed);
  const isStack = active.length > 1;

  useEffect(() => {
    if (!isStack) setExpanded(false);
  }, [isStack]);

  useEffect(() => {
    if (!expanded) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  if (active.length === 0) return null;

  if (isStack && !expanded) {
    const [top] = active;
    return (
      <div className="toast-stack toast-stack--peek" ref={rootRef} onClick={() => setExpanded(true)}>
        <div className="toast-stack__peek-card toast-stack__peek-card--3" />
        <div className="toast-stack__peek-card toast-stack__peek-card--2" />
        <NoticeCard
          key={top.id}
          notification={top}
          variant="toast"
          onOpen={() => markNotificationRead(top.id)}
          onClose={() => dismissToast(top.id)}
        />
        <button type="button" className="toast-stack__expand" aria-label="Expand notifications">
          <ChevronUp size={14} />
          <span>{active.length}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="toast-stack toast-stack--expanded" ref={rootRef}>
      {isStack && (
        <div className="toast-stack__bar">
          <button
            type="button"
            className="toast-stack__collapse"
            onClick={() => setExpanded(false)}
            aria-label="Collapse notifications"
          >
            <ChevronUp size={14} />
          </button>
          <button type="button" className="toast-stack__dismiss-all" onClick={dismissAllToasts}>
            Dismiss all
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      <div className="toast-stack__list">
        {active.map((n) => (
          <NoticeCard
            key={n.id}
            notification={n}
            variant="toast"
            onOpen={() => markNotificationRead(n.id)}
            onClose={() => dismissToast(n.id)}
          />
        ))}
      </div>
    </div>
  );
}
