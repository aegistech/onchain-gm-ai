import React from 'react';
import { AppMode } from '../types';

interface TabSwitcherProps {
  currentMode: AppMode;
  onSwitch: (mode: AppMode) => void;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({ currentMode, onSwitch }) => {
  return (
    <div className="flex bg-slate-800/50 p-1 rounded-xl mb-6 border border-slate-700 backdrop-blur-sm">
      <button
        onClick={() => onSwitch(AppMode.GM_TEXT)}
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
          currentMode === AppMode.GM_TEXT
            ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        📝 Write GM
      </button>
      <button
        onClick={() => onSwitch(AppMode.GM_IMAGE)}
        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
          currentMode === AppMode.GM_IMAGE
            ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        🎨 Draw GM
      </button>
    </div>
  );
};