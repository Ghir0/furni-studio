
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { BrandContext } from '../types';

interface BrandIntelligenceProps {
  context: BrandContext;
  onUpdate: (ctx: BrandContext) => void;
}

const BrandIntelligence: React.FC<BrandIntelligenceProps> = ({ context, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: context.name, 
    sector: context.sector || '',
    market: context.market || '',
    desc: context.aesthetic 
  });
  const [editedSystemPrompt, setEditedSystemPrompt] = useState(context.systemPrompt);

  // Synchronize internal state when context updates (e.g., after generation)
  useEffect(() => {
    setEditedSystemPrompt(context.systemPrompt);
  }, [context.systemPrompt]);

  const handleGenerate = async () => {
    if (!formData.name || !formData.sector || !formData.market) {
      alert("Completa i campi obbligatori: Nome, Settore e Mercato.");
      return;
    }
    setLoading(true);
    try {
      const prompt = await GeminiService.generateBrandContext(
        formData.name, 
        formData.sector, 
        formData.market, 
        formData.desc
      );
      onUpdate({
        name: formData.name,
        sector: formData.sector,
        market: formData.market,
        aesthetic: formData.desc,
        systemPrompt: prompt
      });
    } catch (e) {
      alert("Errore nella generazione del contesto brand.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualEdit = () => {
    onUpdate({
      ...context,
      name: formData.name,
      sector: formData.sector,
      market: formData.market,
      aesthetic: formData.desc,
      systemPrompt: editedSystemPrompt
    });
    alert("Prompt di sistema salvato con successo!");
  };

  const hasChanges = editedSystemPrompt !== context.systemPrompt;

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">Brand Intelligence</h2>
        <p className="text-slate-400 mt-2">Definisci l'anima estetica del tuo brand. Questo motore contestuale verrà iniettato in ogni generazione per garantire coerenza stilistica.</p>
      </header>

      <div className="flex-1 grid md:grid-cols-2 gap-8 min-h-0 overflow-hidden">
        {/* Input Column */}
        <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Brand Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="es. Arredi Moderni Milano"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Settore</label>
              <input 
                type="text" 
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                placeholder="es. Luxury Living"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Mercato</label>
              <input 
                type="text" 
                value={formData.market}
                onChange={(e) => setFormData(prev => ({ ...prev, market: e.target.value }))}
                placeholder="es. High-end Residential"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Filosofia Estetica & DNA</label>
            <textarea 
              rows={5}
              value={formData.desc}
              onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
              placeholder="Descrivi materiali preferiti, palette colori, stili di illuminazione e l'atmosfera core del brand..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all resize-none text-sm"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !formData.name}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 sticky bottom-0 z-10"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-brain"></i>}
            Generate Aesthetic Engine
          </button>
        </div>

        {/* Output Column (Editable) */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative group">
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-2">
              <i className="fas fa-terminal text-blue-400"></i>
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">System Context Prompt Output</h3>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <button 
                  onClick={handleSaveManualEdit}
                  className="text-[10px] bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white px-3 py-1.5 rounded-lg border border-green-600/30 transition-all flex items-center gap-2 shadow-lg shadow-green-500/10"
                >
                  <i className="fas fa-save"></i> Save Changes
                </button>
              )}
              {context.systemPrompt && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(editedSystemPrompt);
                    alert("Prompt copiato negli appunti!");
                  }}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-copy"></i> Copy Prompt
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-[rgba(15,23,42,0.5)]">
            {context.systemPrompt || loading ? (
              <textarea
                value={editedSystemPrompt}
                onChange={(e) => setEditedSystemPrompt(e.target.value)}
                spellCheck={false}
                className="w-full h-full p-8 font-mono text-xs md:text-sm text-slate-300 bg-transparent border-none focus:ring-0 resize-none leading-relaxed custom-scrollbar placeholder:text-slate-700"
                placeholder={loading ? "L'IA sta elaborando il DNA del tuo brand..." : "Inserisci o modifica il prompt di sistema..."}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-40">
                <div className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center">
                   <i className="fas fa-code text-2xl"></i>
                </div>
                <p className="text-xs text-center max-w-[200px] leading-relaxed italic">Il prompt di sistema ottimizzato apparirà qui dopo la generazione e potrà essere modificato manualmente...</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                 <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl shadow-2xl animate-pulse">
                    <i className="fas fa-circle-notch fa-spin text-blue-500"></i>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Generazione in corso...</span>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandIntelligence;
