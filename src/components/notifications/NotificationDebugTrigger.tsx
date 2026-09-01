import { useStore } from '../../store/useStore';

// Prototype-only: fires a random mock notification so the notification
// system can be exercised without waiting on real triggers. Deliberately
// unlabeled and low-contrast — a tiny scratch space for manual QA, not a
// real product control.
export function NotificationDebugTrigger() {
  const pushRandomNotification = useStore((s) => s.pushRandomNotification);

  return (
    <button
      type="button"
      className="notif-debug-btn"
      onClick={pushRandomNotification}
      aria-label="Trigger a test notification"
    />
  );
}
