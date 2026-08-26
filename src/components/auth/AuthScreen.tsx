import { useRef, useState, useCallback, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { Minus, X, Sun, Moon, ClipboardPaste, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

type AuthState = 'idle' | 'checking' | 'error' | 'success';

interface Props {
  onAuthenticated: () => void;
  onMinimize: () => void;
}

function AuthErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="var(--auth-text-primary)" />
      <rect x="7" y="3.5" width="2" height="6.5" rx="1" fill="var(--auth-bg)" />
      <circle cx="8" cy="12" r="1.1" fill="var(--auth-bg)" />
    </svg>
  );
}

function AuthLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path
        d="M26.7245 0H9.2755C4.15368 0 0 4.15342 0 9.27492V26.7228C0 31.8466 4.15368 36 9.2755 36H26.7245C31.8486 36 36 31.8466 36 26.7228V9.27492C36 4.15342 31.8486 0 26.7245 0Z"
        fill="var(--auth-logo-bg)"
      />
      <path
        d="M27.193 28.3847H22.4816V20.8808C22.4816 19.8525 21.8994 19.2815 20.8844 19.2815L15.1179 19.3038C14.1029 19.3038 13.5206 19.8748 13.5206 20.9009V28.3847H8.80704V19.0718H13.5206V15.0678H8.80704V11.8201C8.80704 9.06301 10.8861 6.95285 13.6656 6.95285L26.6263 6.93054V11.5078L15.1179 11.5301C14.1029 11.5301 13.5206 12.206 13.5206 13.232V15.0678L22.7627 15.0455C25.2098 15.0455 27.193 17.0286 27.193 19.4756V28.3847Z"
        fill="var(--auth-logo-fg)"
      />
    </svg>
  );
}

export function AuthScreen({ onAuthenticated, onMinimize }: Props) {
  const login = useStore((s) => s.login);
  const theme = useStore((s) => s.appSettings.theme);
  const updateAppSettings = useStore((s) => s.updateAppSettings);
  const isDarkTheme = theme !== 'light';

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
    }
  }, [cells]);

  const applyDigits = useCallback((pasted: string) => {
    const digits = pasted.replace(/\D/g, '').slice(0, 16);
    if (digits.length === 0) return;
    const next: [string, string, string, string] = ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      next[i] = digits.slice(i * 4, i * 4 + 4);
    }
    setCells(next);
    // Focus the last filled cell or next empty
    const lastFilledCell = Math.min(Math.floor((digits.length - 1) / 4), 3);
    const focusIndex = digits.length >= 16 ? 3 : lastFilledCell;
    setTimeout(() => inputRefs[focusIndex].current?.focus(), 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    applyDigits(e.clipboardData.getData('text'));
  }, [applyDigits]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      applyDigits(text);
    } catch {
      // clipboard API not available — fail silently
    }
  }, [applyDigits]);

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
    if (!isComplete || authState !== 'idle') return;

    setAuthState('checking');

    // Loading delay so the checking state is actually visible (~1s)
    await new Promise((res) => setTimeout(res, 1000));

    const ok = login(fullCode);

    if (ok) {
      setAuthState('success');
      // Flash success icon for 300ms, then start crossfade
      setTimeout(() => {
        onAuthenticated();
      }, 300);
    } else {
      setAuthState('error');
      setShakeKey((k) => k + 1);
    }
  }, [isComplete, authState, fullCode, login, onAuthenticated]);

  // Auto-submit as soon as all 4 cells are filled
  useEffect(() => {
    if (isComplete && authState === 'idle') {
      void handleSubmit();
    }
  }, [isComplete, authState, handleSubmit]);

  const isError = authState === 'error';
  const isSuccess = authState === 'success';
  const isChecking = authState === 'checking';
  const isCellsDisabled = isChecking || isSuccess;

  return (
    <div className="auth-bg">
      <div className="auth-header">
        <span className="auth-header__brand">Fixnet</span>
        {/* TEST-ONLY: remove together with .auth-theme-toggle below */}
        <span className="auth-header__test-code auth-test-only">
          Prototype mode · Test code: <span className="auth-footer__code">1111 1111 1111 1111</span>
        </span>
        <div className="auth-header__actions">
          <button type="button" className="auth-header__btn" onClick={onMinimize} aria-label="Minimize">
            <Minus size={16} />
          </button>
          <button type="button" className="auth-header__btn" onClick={onMinimize} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="auth-header__divider" />
      </div>

      <div className="auth-logo-mark">
        <AuthLogo />
      </div>

      <div className="auth-content">
        <p className="auth-copy">
          Sign in with the access key from your{' '}
          <button type="button" className="auth-link" onClick={() => window.location.reload()}>
            Fixnet account
          </button>{' '}
          dashboard or{' '}
          <button type="button" className="auth-link" onClick={() => window.location.reload()}>
            Telegram bot
          </button>
        </p>

        <div className="auth-form">
          <div
            className={`auth-cells-row${isError ? ' auth-cells-row--error' : ''}`}
            key={shakeKey}
          >
            {([0, 1, 2, 3] as const).map((i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                className={`auth-cell${isError ? ' auth-cell--error' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={cells[i]}
                onChange={(e) => handleChange(i, e)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={isCellsDisabled}
                aria-label={`Code segment ${i + 1}`}
              />
            ))}
            <div className="auth-trailing">
              {isChecking && <span className="auth-spinner" />}
              {isSuccess && <Check size={16} className="auth-success-icon" />}
              {!isChecking && !isSuccess && hasAnyDigits && (
                <button type="button" className="auth-clear-btn" onClick={handleClear}>
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {!hasAnyDigits && !isChecking && (
            <button
              type="button"
              className="auth-paste-btn auth-paste-btn--floating"
              onClick={() => { void handlePasteFromClipboard(); }}
            >
              <ClipboardPaste size={16} />
              Paste from clipboard
            </button>
          )}

          {isError && (
            <div className="auth-error-row">
              <span className="auth-error-icon">
                <AuthErrorIcon />
              </span>
              <p className="auth-error-text">
                Invalid access key. Check your access key in your account dashboard or contact{' '}
                <span className="auth-link-text">Support</span>.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="auth-headline">
        {`Let's get`}
        <span className="auth-headline__accent">{` started`}</span>
      </p>

      {/* TEST-ONLY: remove together with the block above */}
      <button
        type="button"
        className="auth-theme-toggle"
        onClick={() => updateAppSettings({ theme: isDarkTheme ? 'light' : 'dark' })}
        aria-label="Toggle theme"
        title="Toggle theme (test)"
      >
        {isDarkTheme ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}
