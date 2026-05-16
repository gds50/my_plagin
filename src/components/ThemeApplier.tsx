import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export function ThemeApplier() {
  const theme = useAppStore((s) => s.data.settings.theme);
  const background = useAppStore((s) => s.data.settings.background);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('light', !isDark);
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => theme === 'auto' && apply();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, [theme]);

  useEffect(() => {
    const body = document.body;
    if (background.type === 'color') {
      body.style.background = background.value;
    } else if (background.type === 'gradient') {
      body.style.background = background.value;
    } else if (background.type === 'image-url') {
      body.style.background = `url("${background.value}") center/cover no-repeat fixed`;
    }
  }, [background]);

  return null;
}
