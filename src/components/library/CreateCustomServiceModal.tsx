import { useRef, useState } from 'react';
import { AlertTriangle, FolderOpen } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useStore } from '../../store/useStore';

function deriveName(domain: string, exeFileName: string, ipRange: string): string {
  if (domain) return domain;
  if (exeFileName) return exeFileName.replace(/\.[^.]+$/, '') || exeFileName;
  if (ipRange) return ipRange;
  return 'Custom service';
}

export function CreateCustomServiceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const createCustomService = useStore((s) => s.createCustomService);

  const [domain, setDomain] = useState('');
  const [includeSubdomains, setIncludeSubdomains] = useState(false);
  const [exeFile, setExeFile] = useState<File | null>(null);
  const [ipRange, setIpRange] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit() {
    const trimmedDomain = domain.trim();
    const trimmedIpRange = ipRange.trim();

    if (!trimmedDomain && !exeFile && !trimmedIpRange) {
      setError('Fill in at least one of domain, executable, or IP range.');
      return;
    }

    createCustomService({
      name: deriveName(trimmedDomain, exeFile?.name ?? '', trimmedIpRange),
      domains: trimmedDomain ? [trimmedDomain] : [],
      includeSubdomains: trimmedDomain ? includeSubdomains : false,
      exePath: exeFile?.name ?? null,
      ipRange: trimmedIpRange || null,
    });
    onCreated();
  }

  return (
    <Modal
      title="Add service manually"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Add
          </button>
        </>
      }
    >
      <div className="warning-box" style={{ marginBottom: 'var(--space-16)' }}>
        <AlertTriangle size={16} />
        A manually added service isn't reviewed by the Fixnet team. You're responsible for correct configuration
        and for resolving any connection issues.
      </div>

      <p className="form-hint" style={{ marginBottom: 'var(--space-12)' }}>
        Fill in at least one — you can combine a domain, an executable file, and an IP range.
      </p>

      <div className="form-group">
        <label className="form-label">Enter domain</label>
        <input
          className="form-input"
          value={domain}
          onChange={(e) => {
            setDomain(e.target.value);
            setError(null);
          }}
          placeholder="example.com"
        />
        <label className="checkbox-row" style={{ marginTop: 'var(--space-4)' }}>
          <input
            type="checkbox"
            checked={includeSubdomains}
            onChange={(e) => setIncludeSubdomains(e.target.checked)}
          />
          Include subdomains
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">Choose .exe file</label>
        <div className="file-picker-row">
          <button type="button" className="btn btn--sm" onClick={() => fileInputRef.current?.click()}>
            <FolderOpen size={12} />
            Choose file
          </button>
          <span className="file-picker-row__name">{exeFile ? exeFile.name : 'No file selected'}</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".exe"
          style={{ display: 'none' }}
          onChange={(e) => {
            setExeFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Enter IP address or IP range (CIDR)</label>
        <input
          className="form-input"
          value={ipRange}
          onChange={(e) => {
            setIpRange(e.target.value);
            setError(null);
          }}
          placeholder="192.168.1.0/24"
        />
      </div>

      {error && (
        <div className="warning-box" style={{ borderColor: 'var(--err)', background: 'var(--err-dim)', color: 'var(--err)' }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
    </Modal>
  );
}
