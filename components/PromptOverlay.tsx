
import React from 'react';

interface PromptOverlayProps {
  prompt: string;
}

const PromptOverlay: React.FC<PromptOverlayProps> = ({ prompt }) => {
  if (!prompt) return null;

  return (
    <div className="absolute bottom-4 right-4 max-w-xs md:max-w-md bg-black/60 backdrop-blur-md border border-white/20 p-3 rounded-lg text-[10px] md:text-xs text-white/80 font-mono shadow-2xl z-50 pointer-events-none">
      <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-1">
        <i className="fas fa-terminal text-green-400"></i>
        <span className="font-bold uppercase tracking-wider text-green-400">Live Prompt Debug</span>
      </div>
      <div className="line-clamp-4 hover:line-clamp-none transition-all cursor-help pointer-events-auto">
        {prompt}
      </div>
    </div>
  );
};

export default PromptOverlay;
