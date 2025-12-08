import React from 'react';
import { GeneratedContent, AppMode } from '../types';

interface ResultCardProps {
  mode: AppMode;
  content: GeneratedContent;
}

export const ResultCard: React.FC<ResultCardProps> = ({ mode, content }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (content.text) {
      navigator.clipboard.writeText(content.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    let textToShare = "";
    
    if (mode === AppMode.GM_TEXT && content.text) {
      textToShare = content.text;
    } else if (mode === AppMode.GM_IMAGE) {
      textToShare = "GM! ☀️ Just generated this morning vibe with Onchain GM AI. Rate this aesthetic! 👇 #OnchainGM";
    }

    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  if (!content.text && !content.imageUrl) return null;

  return (
    <div className="mt-8 border-2 border-black dark:border-white bg-white dark:bg-black shadow-brutal p-4 animate-fade-in relative">
      {/* Label Tag */}
      <div className="absolute -top-3 left-4 bg-black dark:bg-white px-2 py-0.5 border border-black dark:border-white">
        <span className="text-white dark:text-black text-xs font-bold uppercase tracking-widest font-mono">
          {mode === AppMode.GM_TEXT ? '> OUTPUT_TEXT.TXT' : '> OUTPUT_IMG.PNG'}
        </span>
      </div>

      <div className="flex justify-end gap-2 mb-4 border-b-2 border-dashed border-black/20 dark:border-white/20 pb-2">
            {mode === AppMode.GM_TEXT && (
            <button
                onClick={handleCopy}
                className={`text-xs px-3 py-1 font-bold border-2 border-black dark:border-white shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase ${
                    copied 
                    ? 'bg-green-400 text-black' 
                    : 'bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
                {copied ? '[ COPIED ]' : '[ COPY TEXT ]'}
            </button>
            )}
            <button
                onClick={handleShare}
                className="text-xs px-3 py-1 font-bold border-2 border-black dark:border-white shadow-brutal-sm bg-purple-500 text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all uppercase"
            >
                [ Share Warpcast ]
            </button>
      </div>

      <div className="py-2">
        {mode === AppMode.GM_TEXT ? (
          <div className="font-mono text-lg text-black dark:text-green-400 leading-relaxed whitespace-pre-wrap">
            <span className="opacity-50 select-none mr-2">root@gm:~#</span>
            <span className="typing-effect">{content.text}</span>
            <span className="animate-pulse inline-block w-2 h-5 bg-black dark:bg-green-400 ml-1 align-middle"></span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
             {/* eslint-disable-next-line jsx-a11y/alt-text */}
             <div className="border-2 border-black dark:border-white p-1 bg-gray-100 dark:bg-gray-900">
                <img 
                src={content.imageUrl} 
                className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-500"
                loading="lazy"
                />
             </div>
            
            <p className="text-xs text-center font-mono opacity-70">
                * SYSTEM: Download image to attach manually.
            </p>
            <div className="flex gap-4">
                <a 
                href={content.imageUrl} 
                download={`onchain-gm-${Date.now()}.png`}
                className="flex-1 text-center py-3 border-2 border-black dark:border-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold text-sm uppercase bg-white dark:bg-gray-800 text-black dark:text-white transition-all"
                >
                [ Download ]
                </a>
                <button
                    onClick={handleShare}
                    className="flex-1 text-center py-3 border-2 border-black dark:border-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold text-sm uppercase bg-neon-orange text-white dark:text-black transition-all"
                >
                    [ Share ]
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};