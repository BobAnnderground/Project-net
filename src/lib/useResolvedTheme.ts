import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

/** Resolves the 'system' theme setting against the OS preference. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useStore((s) => s.appSettings.theme);
  const [resolved, setResolved] = useState<'light' | 'dark'>(theme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    function apply() {
      setResolved(theme === 'system' ? (media.matches ? 'light' : 'dark') : theme);
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return resolved;
}
