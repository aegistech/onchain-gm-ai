import React from 'react';
import { AppMode } from '../types';

interface TabSwitcherProps {
  currentMode: AppMode;
  onSwitch: (mode: AppMode) => void;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({ currentMode, onSwitch }) => {
  return (
    <div className="flex mb-4 gap-2">
      <button
        onClick={() => onSwitch(AppMode.GM_TEXT)}
        className={`flex-1 py-2 font-bold uppercase text-sm border-2 border-black dark:border-white transition-all rounded-lg ${
          currentMode === AppMode.GM_TEXT
            ? 'bg-black text-white dark:bg-white dark:text-black shadow-none translate-x-[1px] translate-y-[1px]'
            : 'bg-white text-black dark:bg-black dark:text-white shadow-brutal hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
        }`}
      >
        📝 Write GM
      </button>
      <button
        onClick={() => onSwitch(AppMode.GM_IMAGE)}
        className={`flex-1 py-2 font-bold uppercase text-sm border-2 border-black dark:border-white transition-all rounded-lg ${
          currentMode === AppMode.GM_IMAGE
            ? 'bg-black text-white dark:bg-white dark:text-black shadow-none translate-x-[1px] translate-y-[1px]'
            : 'bg-white text-black dark:bg-black dark:text-white shadow-brutal hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]'
        }`}
      >
        🎨 Draw GM
      </button>
    </div>
  );
};
