import { useRef, useState, useCallback, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';

type AuthState = 'idle' | 'checking' | 'error' | 'success';

interface Props {
  onAuthenticated: () => void;
}

export function AuthScreen({ onAuthenticated }: Props) {
  const login = useStore((s) => s.login);

  const [cells, setCells] = useState<[string, string, string, string]>(['', '', '', '']);
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [shakeKey, setShakeKey] = useState(0);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-focus first cell on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fullCode = cells.join('');
  const isComplete = fullCode.length === 16;
  const hasAnyDigits = fullCode.length > 0;

  const handleDigitInput = useCallback((index: number, value: string) => {
    // Only allow digits, strip everything else
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCells((prev) => {
      const next: [string, string, string, string] = [...prev] as [string, string, string, string];
      next[index] = digits;
      return next;
    });
    // Auto-advance if cell is full
    if (digits.length === 4 && index < 3) {
      setTimeout(() => inputRefs[index + 1].current?.focus(), 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (cells[index] === '' && index > 0) {
        // Move focus to previous cell and remove its last digit
        e.preventDefault();
        setCells((prev) => {
          const next: [string, string, string, string] = [...prev] as [string, string, string, string];
          next[index - 1] = next[index - 1].slice(0, -1);
          return next;
        });
        inputRefs[index - 1].current?.focus();
      }
      // If non-empty, the default behavior handles deleting last char (but we control value)
      // We need to handle it manually since input is controlled
      if (cells[index] !== '') {
        e.preventDefault();
        setCells((prev) => {
          const next: [string, string, string, string] = [...prev] as [string, string, string, string];
          next[index] = next[index].slice(0, -1);
          return next;
        });
      }
    } else if (e.key === 'Enter') {
      if (isComplete) {
        void handleSubmit();
      }
    }
  }, [cells, isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 16);
    if (pasted.length === 0) return;
    const next: [string, string, string, string] = ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      next[i] = pasted.slice(i * 4, i * 4 + 4);
    }
    setCells(next);
    // Focus the last filled cell or next empty
    const lastFilledCell = Math.min(Math.floor((pasted.length - 1) / 4), 3);
    const focusIndex = pasted.length >= 16 ? 3 : lastFilledCell;
    setTimeout(() => inputRefs[focusIndex].current?.focus(), 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear error state as soon as user types a new digit
  const handleChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (authState === 'error') {
      setAuthState('idle');
    }
    handleDigitInput(index, e.target.value);
  }, [authState, handleDigitInput]);

  const handleClear = useCallback(() => {
    setCells(['', '', '', '']);
    setAuthState('idle');
    inputRefs[0].current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    if (!isComplete || authState === 'checking' || authState === 'success') return;

    setAuthState('checking');

    // Brief loading delay (~200ms)
    await new Promise((res) => setTimeout(res, 200));

    const ok = login(fullCode);

    if (ok) {
      setAuthState('success');
      // Flash ok border for 300ms, then start crossfade
      setTimeout(() => {
        onAuthenticated();
      }, 300);
    } else {
      setAuthState('error');
      setShakeKey((k) => k + 1);
    }
  }, [isComplete, authState, fullCode, login, onAuthenticated]);

  const isError = authState === 'error';
  const isSuccess = authState === 'success';
  const isChecking = authState === 'checking';
  const isDisabled = !isComplete || isChecking || isSuccess;

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Wordmark */}
        <div className="auth-wordmark">
          <div className="auth-wordmark__glyph" aria-hidden="true" />
          <span className="auth-wordmark__text">FIXNET</span>
        </div>

        {/* Label */}
        <div className="auth-label-gap" />
        <div className="auth-label-row">
          <label className="auth-label">Enter the authorization key</label>
          {hasAnyDigits && !isChecking && !isSuccess && (
            <button type="button" className="auth-clear-btn" onClick={handleClear}>
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        {/* 4-cell input group */}
        <div className="auth-input-gap-sm" />
        <div
          className={`auth-cells${isError ? ' auth-cells--error' : ''}${isSuccess ? ' auth-cells--success' : ''}`}
          key={shakeKey}
        >
          {([0, 1, 2, 3] as const).map((i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              className={`auth-cell${isError ? ' auth-cell--error' : ''}${isSuccess ? ' auth-cell--success' : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cells[i]}
              placeholder="· · · ·"
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={isChecking || isSuccess}
              aria-label={`Code segment ${i + 1}`}
            />
          ))}
        </div>

        {/* Log in button */}
        <div className="auth-btn-gap" />
        <button
          className={`auth-login-btn${isDisabled ? ' auth-login-btn--disabled' : ' auth-login-btn--enabled'}`}
          onClick={() => { void handleSubmit(); }}
          disabled={isDisabled}
          type="button"
        >
          {isChecking ? '···' : 'Log in'}
        </button>

        {/* Error message area — always reserves height */}
        <div className="auth-error-gap" />
        <div className={`auth-error-msg${isError ? ' auth-error-msg--visible' : ''}`}>
          Invalid authorization key. Check that it's up to date in your account on the website, or contact{' '}
          <span className="auth-error-msg__link">support</span>.
        </div>

        {/* Divider */}
        <div className="auth-divider-gap" />
        <hr className="auth-divider" />
        <div className="auth-footer-gap" />
        <p className="auth-footer">
          Prototype mode · Test code:{' '}
          <span className="auth-footer__code">1111 1111 1111 1111</span>
        </p>
      </div>
    </div>
  );
}
