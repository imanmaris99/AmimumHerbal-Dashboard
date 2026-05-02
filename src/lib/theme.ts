export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'amimum-theme-mode';

const getSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export const getStoredThemeMode = (): ThemeMode => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
};

export const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') return getSystemDark() ? 'dark' : 'light';
  return mode;
};

export const applyTheme = (mode: ThemeMode) => {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
};

export const setThemeMode = (mode: ThemeMode) => {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
};

export const initTheme = () => {
  const mode = getStoredThemeMode();
  applyTheme(mode);
  return mode;
};
