import { Modal } from '../common/Modal';

export function ManualServiceIntroModal({
  onCancel,
  onContactSupport,
  onProceed,
}: {
  onCancel: () => void;
  onContactSupport: () => void;
  onProceed: () => void;
}) {
  return (
    <Modal
      title="Create service manually"
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onContactSupport}>
            Contact support
          </button>
          <button className="btn btn--primary" onClick={onProceed}>
            Add service manually
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, color: 'var(--text-1)', margin: 0, lineHeight: 1.5 }}>
        Adding a service yourself works best for personal or non-standard services. If the service is public,
        consider contacting support instead — it'll be added to the Fixnet library with verified settings.
      </p>
    </Modal>
  );
}
