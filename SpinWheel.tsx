
import React, { useState, useEffect, useRef } from 'react';
// FIX: Import from local file (same directory), not utils
import { playTickSound, playSuccessSound } from './audio';

interface SpinWheelProps {
  isSpinning: boolean;
  onSpin: () => void;
  resultIndex: number | null;
  onFinished: () => void;
  disabled: boolean;
}

const PRIZES = [
  { label: '100 DEGEN', color: '#8b5cf6', text: '#fff' }, // Violet
  { label: 'GOOD LUCK', color: '#000000', text: '#fff' }, // Black
  { label: 'NFT WL', color: '#fbbf24', text: '#000' }, // Amber
  { label: 'TRY AGAIN', color: '#fff', text: '#000' }, // White
  { label: '500 XP', color: '#10b981', text: '#000' }, // Emerald
  { label: '0.01 ETH', color: '#3b82f6', text: '#fff' }, // Blue
];

export const SpinWheel: React.FC<SpinWheelProps> = ({ isSpinning, onSpin, resultIndex, onFinished, disabled }) => {
  const [rotation, setRotation] = useState(0);
  const tickRef = useRef<number | null>(null);
  
  // Brutalist gradient: Hard stops
  const gradientString = PRIZES.map((prize, index) => {
    const start = (index * 100) / PRIZES.length;
    const end = ((index + 1) * 100) / PRIZES.length;
    return `${prize.color} ${start}% ${end}%`;
  }).join(', ');

  useEffect(() => {
    if (isSpinning && resultIndex !== null) {
      const segmentAngle = 360 / PRIZES.length;
      const halfSegment = segmentAngle / 2;
      const centerOfTarget = (resultIndex * segmentAngle) + halfSegment;
      const finalRotation = 1800 + (360 - centerOfTarget);

      setRotation(finalRotation);

      // Play tick sounds
      let count = 0;
      const maxTicks = 20; // Number of ticks to play
      const tickInterval = setInterval(() => {
         count++;
         playTickSound();
         if (count >= maxTicks) clearInterval(tickInterval);
      }, 150); // Play a tick every 150ms

      const timer = setTimeout(() => {
        onFinished();
        playSuccessSound(); // Play fanfare when done
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearInterval(tickInterval);
      };
    }
  }, [isSpinning, resultIndex, onFinished]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-black dark:border-white bg-white/80 dark:bg-terminal/90 backdrop-blur-md shadow-brutal relative mt-8 rounded-xl">
      
      {/* Title */}
      <div className="flex items-center gap-2 mb-6 border-2 border-black dark:border-white px-4 py-1 bg-yellow-400 dark:bg-purple-600 shadow-brutal-sm transform -rotate-1">
        <h3 className="font-mono font-black text-xl uppercase text-black dark:text-white">
          Lucky_Wheel.exe
        </h3>
      </div>

      {/* Wheel Container */}
      <div className="relative w-64 h-64 mb-8">
        
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30">
             <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-black dark:border-t-white"></div>
        </div>

        {/* The Disc */}
        <div 
          className="w-full h-full rounded-full relative overflow-hidden border-4 border-black dark:border-white transition-transform cubic-bezier(0.2, 0.8, 0.2, 1)"
          style={{ 
            background: `conic-gradient(${gradientString})`,
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '4000ms' : '0ms'
          }}
        >
          {/* Content inside */}
          {PRIZES.map((prize, index) => {
            const segmentAngle = 360 / PRIZES.length;
            const rotation = index * segmentAngle + (segmentAngle / 2);
            return (
              <div
                key={index}
                className="absolute top-0 left-1/2 w-1 h-[50%] origin-bottom flex flex-col items-center justify-start pt-2"
                style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
              >
                  <span 
                        className="text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap px-1 py-0.5"
                        style={{ color: prize.text, writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                    >
                        {prize.label}
                  </span>
              </div>
            );
          })}
        </div>
        
        {/* Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-black rounded-full border-4 border-black dark:border-white flex items-center justify-center z-20">
            <div className="w-4 h-4 bg-black dark:bg-white rounded-full"></div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onSpin}
        disabled={disabled}
        className={`
            w-full max-w-[200px] py-3 font-mono font-bold text-lg uppercase border-2 border-black dark:border-white shadow-brutal transition-all transform rounded-lg
            ${disabled 
                ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none translate-x-[4px] translate-y-[4px]' 
                : 'bg-neon-green text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-white'}
        `}
      >
        {isSpinning ? 'SPINNING...' : 'START SPIN'}
      </button>
    </div>
  );
};
