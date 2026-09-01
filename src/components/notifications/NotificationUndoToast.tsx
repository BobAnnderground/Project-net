import { useStore } from '../../store/useStore';

export function NotificationUndoToast() {
  const undo = useStore((s) => s.notificationsUndo);
  const undoDeleteAllNotifications = useStore((s) => s.undoDeleteAllNotifications);

  if (!undo) return null;

  return (
    <div className="notif-undo-toast">
      <span>{undo.count} notification{undo.count === 1 ? '' : 's'} deleted</span>
      <button type="button" className="notif-undo-toast__btn" onClick={undoDeleteAllNotifications}>
        Undo
      </button>
    </div>
  );
}
