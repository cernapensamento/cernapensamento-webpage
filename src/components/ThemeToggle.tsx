'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Prevent hydration mismatch by not rendering the icon until mounted
  if (!mounted) {
    return (
      <div className="w-10 h-10 border border-lines bg-parchment" aria-hidden="true" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 border border-lines bg-parchment text-charcoal hover:bg-lines transition-colors duration-300 flex items-center justify-center w-10 h-10 shadow-lg"
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      <span className="font-serif text-lg leading-none">
        {isDark ? '☼' : '☾'}
      </span>
    </button>
  );
}
