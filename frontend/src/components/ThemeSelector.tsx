import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, THEMES, ThemeId } from '../context/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, themeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 text-slate-200 text-xs font-semibold shadow-md transition-all group"
        title="Change UI Theme"
      >
        <Palette className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline font-mono text-[11px]">{themeConfig.badge} {themeConfig.name}</span>
        <span className="sm:hidden">{themeConfig.badge}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Theme Palettes
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Real-time switch</span>
          </div>

          <div className="mt-1 space-y-1">
            {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
              const item = THEMES[themeKey];
              const isSelected = theme === themeKey;

              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    setTheme(themeKey);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-slate-800/90 border border-cyan-500/40 text-white shadow-lg'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{item.badge}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold group-hover:text-cyan-300 transition">
                          {item.name}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.accentColor }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
