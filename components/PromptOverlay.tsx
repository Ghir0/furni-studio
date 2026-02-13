
import React from 'react';

interface PromptOverlayProps {
  prompt: string;
}

const PromptOverlay: React.FC<PromptOverlayProps> = ({ prompt }) => {
  if (!prompt) return null;

  return (
    <div className="absolute bottom-6 left-6 max-w-xs md:max-w-sm bg-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-[10px] md:text-[11px] text-white/70 font-mono shadow-2xl z-50 pointer-events-none group-hover:pointer-events-auto transition-all">
      <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-bold uppercase tracking-[0.2em] text-green-400">Live Prompt Debug</span>
        </div>
        <i className="fas fa-microchip text-slate-500 text-xs"></i>
      </div>
      <div className="line-clamp-3 hover:line-clamp-none transition-all duration-300 cursor-help text-slate-300 leading-relaxed overflow-hidden">
        {prompt}
      </div>
    </div>
  );
};

export default PromptOverlay;
