
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Asset, BrandContext, HumanModel } from '../types';
import { VIEW_TYPES, ASPECT_RATIOS } from '../constants';
import PromptOverlay from './PromptOverlay';
import ModelCard from './ModelCard';

interface ImageDevelopmentProps {
  brand: BrandContext;
  inputAsset?: Asset;
  onSaveAsset: (asset: Asset) => void;
}

const ImageDevelopment: React.FC<ImageDevelopmentProps> = ({ brand, inputAsset, onSaveAsset }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(inputAsset?.url || null);
  const [visualDNA, setVisualDNA] = useState<string>("");
  const [editInstruction, setEditInstruction] = useState("");
  const [models, setModels] = useState<HumanModel[]>([]);
  const [ratio, setRatio] = useState("1:1");
  const [selectedView, setSelectedView] = useState<string>("");
  
  const baseFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputAsset?.url) {
      setBaseImage(inputAsset.url);
      setVisualDNA("");
      setSelectedView("");
    }
  }, [inputAsset]);

  const handleAnalyzeSource = async () => {
    if (!baseImage) return;
    setAnalyzing(true);
    try {
      const desc = await GeminiService.describeImage(baseImage);
      setVisualDNA(desc);
    } catch (e) {
      alert("Analisi fallita.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUploadBase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBaseImage(reader.result as string);
      setVisualDNA("");
      setSelectedView("");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyEdit = async () => {
    if (!baseImage || !editInstruction) return;
    setLoading(true);
    try {
      const result = await GeminiService.editImage(baseImage, editInstruction, { aspectRatio: ratio });
      setBaseImage(result);
      setEditInstruction("");
      onSaveAsset({
        id: `edit-${Date.now()}`,
        url: result,
        type: 'render',
        timestamp: Date.now(),
        metadata: { brandStyle: brand.name, prompt: editInstruction }
      });
    } catch (e) {
      alert("Edit fallito");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateConsistency = async () => {
    if (!baseImage || !selectedView) return;
    setLoading(true);

    try {
      let dna = visualDNA;
      if (!dna) {
        setAnalyzing(true);
        dna = await GeminiService.describeImage(baseImage);
        setVisualDNA(dna);
        setAnalyzing(false);
      }

      const prompt = GeminiService.assembleConsistencyPrompt(selectedView, brand.systemPrompt, dna);
      const result = await GeminiService.editImage(baseImage, prompt, { aspectRatio: ratio });
      
      const newAsset: Asset = {
        id: `cons-${selectedView.replace(/\s/g, '-')}-${Date.now()}`,
        url: result,
        type: 'render',
        timestamp: Date.now(),
        metadata: { brandStyle: brand.name, prompt: `Consistency view: ${selectedView}` }
      };
      
      onSaveAsset(newAsset);
      setBaseImage(result); 
      setSelectedView(""); 
    } catch (e) {
      alert("Errore durante la generazione della vista coerente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
      {/* Controls */}
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
        <header className="space-y-1">
          <h2 className="text-xl font-bold">Sviluppo Immagine</h2>
          <p className="text-xs text-slate-400">Affina i render e gestisci la coerenza del prodotto.</p>
        </header>

        {/* Source Asset */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Asset Sorgente</h3>
            {baseImage && (
              <button 
                onClick={handleAnalyzeSource}
                disabled={analyzing}
                className={`text-[10px] px-3 py-1 rounded-lg font-bold border transition-all ${visualDNA ? 'bg-green-600/20 border-green-600/40 text-green-400' : 'bg-blue-600/20 border-blue-600/40 text-blue-400 hover:bg-blue-600/30'}`}
              >
                {analyzing ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-microscope mr-1"></i>}
                {visualDNA ? 'DNA Analizzato' : 'Analizza DNA Prodotto'}
              </button>
            )}
          </div>
          <button 
            onClick={() => baseFileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all overflow-hidden relative"
          >
            {baseImage ? (
              <img src={baseImage} className="absolute inset-0 w-full h-full object-contain p-2 opacity-60" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <i className="fas fa-upload text-slate-600"></i>
                <span className="text-[10px] font-bold text-slate-500">Carica Sorgente</span>
              </div>
            )}
          </button>
          <input type="file" ref={baseFileRef} onChange={handleUploadBase} className="hidden" accept="image/*" />
          
          {visualDNA && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
              <span className="text-[9px] uppercase font-bold text-slate-600 block mb-1">Visual Analysis Anchor</span>
              <p className="text-[10px] text-slate-400 italic line-clamp-3 hover:line-clamp-none transition-all cursor-help">{visualDNA}</p>
            </div>
          )}
        </section>

        {/* Configurazione Output */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Configurazione Output</h3>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 px-1">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  className={`text-[10px] py-2 rounded-lg border transition-all font-bold ${
                    ratio === r 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Consistency Engine */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border-2 border-dashed border-slate-800 space-y-4">
          <div className="flex flex-col gap-1 mb-2">
             <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <i className="fas fa-camera-retro text-blue-500"></i>
                Vista Alternativa Coerente
             </h3>
             <p className="text-[10px] text-slate-500">Cambia inquadratura mantenendo il prodotto identico</p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {VIEW_TYPES.map(view => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`text-[10px] py-2 px-3 rounded-lg border transition-all text-left truncate ${
                  selectedView === view 
                    ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleGenerateConsistency}
            disabled={loading || !baseImage || !selectedView}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <i className="fas fa-wand-magic-sparkles"></i>
            {loading ? 'Generazione...' : selectedView ? `Genera Vista ${selectedView}` : 'Seleziona una Vista'}
          </button>
        </section>

        {/* Human Models */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Human Model System</h3>
            <button 
              onClick={() => setModels([...models, { id: Math.random().toString(36).substr(2, 9), gender: 'female', interaction: 'interazione naturale' }])}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-lg font-bold border border-slate-700"
            >
              + Aggiungi
            </button>
          </div>
          {models.map(m => (
            <ModelCard 
              key={m.id} 
              model={m} 
              onUpdate={(u) => setModels(models.map(x => x.id === u.id ? u : x))} 
              onRemove={() => setModels(models.filter(x => x.id !== m.id))} 
            />
          ))}
        </section>

        {/* Rapid Editing */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Inpainting Conversazionale</h3>
          <textarea 
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            placeholder="Esegui modifiche tramite chat (es. 'cambia il colore del tessuto in rosso')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-600 resize-none outline-none"
            rows={2}
          />
          <button 
            onClick={handleApplyEdit}
            disabled={loading || !baseImage || !editInstruction}
            className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-[11px]"
          >
            Applica Inpainting
          </button>
        </section>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden h-full">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Area Preview / Editor Sviluppo</span>
             {(analyzing || loading) && <span className="text-[10px] text-blue-400 animate-pulse font-bold">
               {analyzing ? 'ANALISI DNA IN CORSO...' : 'GENERAZIONE IN CORSO...'}
             </span>}
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]">
            {baseImage ? (
              <img src={baseImage} alt="Base" className="w-full h-full object-contain rounded-xl shadow-2xl transition-all duration-700 animate-in zoom-in-95" />
            ) : (
              <div className="text-slate-700 text-center space-y-4">
                <i className="fas fa-image text-4xl opacity-20"></i>
                <p className="text-xs font-medium">Nessuna immagine selezionata</p>
              </div>
            )}
            <PromptOverlay prompt={editInstruction ? `EDIT: ${editInstruction}` : (visualDNA ? 'Anchor DNA Attivo' : (selectedView ? `GENERAZIONE: Vista ${selectedView}` : ''))} />
          </div>
          
          {baseImage && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/10 flex justify-end gap-3">
              <button 
                onClick={() => onSaveAsset({
                  id: `dev-${Date.now()}`,
                  url: baseImage,
                  type: 'render',
                  timestamp: Date.now(),
                  metadata: { brandStyle: brand.name, prompt: 'Asset sviluppato' }
                })}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-all border border-slate-700"
              >
                Salva Versione Corrente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDevelopment;
