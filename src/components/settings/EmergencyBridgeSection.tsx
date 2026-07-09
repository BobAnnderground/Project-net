import { useState } from 'react';
import { Check, Send, ExternalLink } from 'lucide-react';
import { useStore } from '../../store/useStore';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function generateMockBridgeCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${seg()}-${seg()}-${seg()}`;
}

export function EmergencyBridgeSection() {
  const emergencyBridge = useStore((s) => s.emergencyBridge);
  const addEmergencyBridge = useStore((s) => s.addEmergencyBridge);

  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSource, setCopiedSource] = useState<'telegram' | 'account' | null>(null);

  async function handleAddBridge() {
    const trimmed = inputCode.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 900));
    addEmergencyBridge(trimmed);
    setIsSubmitting(false);
    setInputCode('');
  }

  function handleCopySource(source: 'telegram' | 'account') {
    const code = generateMockBridgeCode();
    try {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopiedSource(source);
          setTimeout(() => setCopiedSource(null), 1500);
        })
        .catch(() => {});
    } catch {
      // clipboard API not available — fail silently
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section__title">Emergency bridges</div>
      <div className="settings-row__desc" style={{ marginBottom: 12 }}>
        Emergency bridges keep Fixnet connected when a route becomes unavailable — connected automatically, no
        setup needed.
      </div>

      <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
        <div className="settings-row__label">Current emergency bridge</div>
        {emergencyBridge ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="settings-key-box" style={{ flex: 1 }}>{emergencyBridge.code}</div>
              <span className={`status-badge status--${emergencyBridge.status === 'active' ? 'connected' : 'error'}`}>
                <span className="status-dot" />
                {emergencyBridge.status === 'active' ? 'Working' : 'Not working'}
              </span>
            </div>
            <div className="form-hint">Added {formatDate(emergencyBridge.addedAt)}</div>
            {emergencyBridge.status === 'failed' && (
              <div className="warning-box" style={{ borderColor: 'var(--err)', background: 'var(--err-dim)', color: 'var(--err)' }}>
                This bridge isn't responding. Request a new one below.
              </div>
            )}
          </>
        ) : (
          <div className="form-hint">No emergency bridge configured yet.</div>
        )}
      </div>

      <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, borderBottom: 'none' }}>
        <div className="settings-row__label">Add a new bridge</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Paste bridge code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            className="btn btn--sm btn--primary"
            style={{ width: 36, justifyContent: 'center', padding: 0, flexShrink: 0 }}
            onClick={handleAddBridge}
            disabled={!inputCode.trim() || isSubmitting}
            aria-label="Confirm bridge"
          >
            {isSubmitting ? <span className="spinner" /> : <Check size={14} />}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btn btn--sm" onClick={() => handleCopySource('telegram')}>
            <Send size={12} />
            {copiedSource === 'telegram' ? 'Code copied' : 'Get via Telegram bot'}
          </button>
          <button className="btn btn--sm" onClick={() => handleCopySource('account')}>
            <ExternalLink size={12} />
            {copiedSource === 'account' ? 'Code copied' : 'Get in personal account'}
          </button>
        </div>
      </div>
    </div>
  );
}
