import { useState, useEffect } from 'react';

const STORAGE_KEY = 'shortly-theme';

export function useTheme() {
  const [mode, setMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'system'
  );

  useEffect(() => {
    const html = document.documentElement;
    if (mode === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return { mode, setMode };
}
