
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { BrandContext } from '../types';

interface BrandIntelligenceProps {
  context: BrandContext;
  onUpdate: (ctx: BrandContext) => void;
}

const BrandIntelligence: React.FC<BrandIntelligenceProps> = ({ context, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: context.name, desc: context.aesthetic });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = await GeminiService.generateBrandContext(formData.name, formData.desc);
      onUpdate({
        name: formData.name,
        aesthetic: formData.desc,
        systemPrompt: prompt
      });
    } catch (e) {
      alert("Error generating brand context");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 shrink-0">
        <h2 className="text-3xl font-bold">Brand Intelligence</h2>
        <p className="text-slate-400">Establish the aesthetic soul of your furniture line. This context will be injected into every generation for consistency.</p>
      </header>

      <div className="flex-1 grid md:grid-cols-2 gap-8 min-h-0 overflow-hidden">
        {/* Input Column */}
        <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 px-1">Brand Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Minimalist Nordic Luxe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 px-1">Aesthetic Philosophy</label>
            <textarea 
              rows={6}
              value={formData.desc}
              onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
              placeholder="Describe materials, tones, lighting, and the core DNA of the furniture line..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none text-sm"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !formData.name}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 sticky bottom-0 z-10"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
            Generate Aesthetic Engine
          </button>
        </div>

        {/* Output Column */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative group">
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-2">
              <i className="fas fa-brain text-blue-400"></i>
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">System Context Prompt</h3>
            </div>
            {context.systemPrompt && (
              <button 
                onClick={() => navigator.clipboard.writeText(context.systemPrompt)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
              >
                Copy Prompt
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 font-mono text-xs md:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed custom-scrollbar">
            {context.systemPrompt ? (
              context.systemPrompt
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-50">
                <i className="fas fa-terminal text-4xl"></i>
                <p className="text-xs italic">Engine prompt will appear here after generation...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandIntelligence;
