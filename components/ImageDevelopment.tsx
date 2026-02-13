
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
  const [baseImage, setBaseImage] = useState<string | null>(inputAsset?.url || null);
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [models, setModels] = useState<HumanModel[]>([]);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [ratio, setRatio] = useState("1:1");
  
  const baseFileRef = useRef<HTMLInputElement>(null);

  // Reset variant when base changes
  useEffect(() => {
    if (inputAsset?.url) {
      setBaseImage(inputAsset.url);
      setVariantImage(null);
    }
  }, [inputAsset]);

  const handleUploadBase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBaseImage(reader.result as string);
      setVariantImage(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleView = (view: string) => {
    if (selectedView === view) {
      setSelectedView(null);
    } else {
      setSelectedView(view);
    }
  };

  const handleApplyEdit = async () => {
    if (!baseImage || !editInstruction) return;
    setLoading(true);
    try {
      const result = await GeminiService.editImage(baseImage, editInstruction, { aspectRatio: ratio });
      setBaseImage(result);
      setEditInstruction("");
      onSaveAsset({
        id: `edit-${Math.random().toString(36).substr(2, 5)}`,
        url: result,
        type: 'render',
        timestamp: Date.now(),
        metadata: { brandStyle: brand.name, prompt: editInstruction }
      });
    } catch (e) {
      alert("Edit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResizeSource = async () => {
    if (!baseImage) return;
    setLoading(true);
    try {
      const prompt = GeminiService.assembleResizePrompt(brand.systemPrompt, ratio);
      const result = await GeminiService.editImage(baseImage, prompt, { aspectRatio: ratio });
      setBaseImage(result);
      
      onSaveAsset({
        id: `resize-${ratio.replace(':', '-')}-${Math.random().toString(36).substr(2, 5)}`,
        url: result,
        type: 'render',
        timestamp: Date.now(),
        metadata: { brandStyle: brand.name, prompt: `Resized to ${ratio}` }
      });
    } catch (e) {
      alert("Resize failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHumanModel = () => {
    const newModel: HumanModel = {
      id: Math.random().toString(36).substr(2, 9),
      gender: 'female',
      interaction: 'seduta comodamente sul prodotto'
    };
    setModels(prev => [...prev, newModel]);
  };

  const handleUpdateModel = (updated: HumanModel) => {
    setModels(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const handleGenerateConsistencyView = async () => {
    if (!baseImage || !selectedView) return;
    setLoading(true);
    try {
      const prompt = GeminiService.assembleConsistencyPrompt("Original", selectedView, brand.systemPrompt);
      const result = await GeminiService.editImage(baseImage, prompt, { aspectRatio: ratio });
      setVariantImage(result);
      
      const newAsset: Asset = {
        id: `cons-${selectedView.toLowerCase().replace(/\s/g, '-')}-${Math.random().toString(36).substr(2, 5)}`,
        url: result,
        type: 'render',
        timestamp: Date.now(),
        metadata: { 
          brandStyle: brand.name, 
          prompt: `Consistency view: ${selectedView}`,
          lighting: 'Inherited from source'
        }
      };
      onSaveAsset(newAsset);
      setSelectedView(null);
    } catch (e) {
      alert("Consistency generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
      {/* Dev Controls */}
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
        <header className="space-y-1">
          <h2 className="text-xl font-bold">Sviluppo Immagine</h2>
          <p className="text-xs text-slate-400">Affina i render e gestisci la coerenza del prodotto.</p>
        </header>

        {/* Source Image Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Asset Sorgente</h3>
          <button 
            onClick={() => baseFileRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all overflow-hidden relative"
          >
            {baseImage ? (
              <>
                <img src={baseImage} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <i className="fas fa-sync text-blue-400"></i>
                  <span className="text-[10px] font-bold bg-black/60 px-3 py-1 rounded-lg">Cambia Immagine</span>
                </div>
              </>
            ) : (
              <>
                <i className="fas fa-upload text-slate-600"></i>
                <span className="text-[10px] font-bold text-slate-500">Carica Immagine Progetto</span>
              </>
            )}
          </button>
          <input type="file" ref={baseFileRef} onChange={handleUploadBase} className="hidden" accept="image/*" />
        </section>


        {/* Output Global Configuration */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Configurazione Output</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 px-1">Aspect Ratio Target</label>
              <select 
                value={ratio} 
                onChange={(e) => setRatio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-600 outline-none"
              >
                {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            
            <button 
              onClick={handleResizeSource}
              disabled={loading || !baseImage}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-2 rounded-lg border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-expand-arrows-alt"></i>
              Resize Source to {ratio}
            </button>
          </div>
        </section>

        
        {/* Consistency Engine Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border-2 border-dashed border-slate-800 space-y-4">
          <div className="flex flex-col items-center text-center gap-1 mb-2">
             <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-1">
                <i className="fas fa-camera-retro text-blue-500"></i>
             </div>
             <h3 className="text-sm font-bold text-slate-200">Consistency Engine</h3>
             <p className="text-[10px] text-slate-500">Genera 1 vista alternativa perfettamente coerente</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {VIEW_TYPES.map(view => (
              <button 
                key={view}
                onClick={() => handleToggleView(view)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between ${
                  selectedView === view 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <span className="truncate">{view}</span>
                {selectedView === view && <i className="fas fa-check text-[8px]"></i>}
              </button>
            ))}
          </div>

          <button 
            onClick={handleGenerateConsistencyView}
            disabled={loading || !baseImage || !selectedView}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <i className="fas fa-magic"></i>
            Genera Vista Consistente
          </button>
        </section>

        {/* Human Models Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Human Model System</h3>
            <button 
              onClick={handleAddHumanModel}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-lg font-bold transition-all border border-slate-700"
            >
              + Aggiungi
            </button>
          </div>
          <div className="space-y-4">
            {models.map((model) => (
              <ModelCard 
                key={model.id} 
                model={model} 
                onUpdate={handleUpdateModel} 
                onRemove={() => setModels(prev => prev.filter(m => m.id !== model.id))} 
              />
            ))}
          </div>
        </section>

        {/* Editing Conversazionale */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Editing Rapido</h3>
          <textarea 
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            placeholder="Istruzioni (es. 'Aggiungi un tappeto sotto')..."
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

      {/* Preview Area (OTTIMIZZATA PER MOSTRARE TUTTA L'IMMAGINE CON CONTAIN) */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Source Box */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative group shadow-2xl flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center shrink-0">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Prodotto Sorgente</span>
             {baseImage && (
               <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                 <i className="fas fa-check-circle"></i> Attivo
               </span>
             )}
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] overflow-hidden">
            {baseImage ? (
              <img 
                src={baseImage} 
                alt="Refined" 
                className="w-full h-full object-contain rounded-xl shadow-2xl pointer-events-none" 
              />
            ) : (
              <div className="text-slate-600 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-800 opacity-20">
                  <i className="fas fa-image text-4xl"></i>
                </div>
                <p className="text-sm font-medium">Carica un'immagine sorgente</p>
              </div>
            )}
            <PromptOverlay prompt={editInstruction ? `EDIT: ${editInstruction}` : 'Sorgente principale'} />
          </div>
        </div>

        {/* Variant Box */}
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative group shadow-2xl flex flex-col transition-all duration-700">
          <div className="p-4 border-b border-slate-800 bg-blue-900/10 flex justify-between items-center shrink-0">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Variante Consistente (Auto-Saved)</span>
             {variantImage && (
               <div className="flex gap-2">
                 <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-600/30 font-bold">In Galleria</span>
                 <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-0.5 rounded border border-green-600/30 font-bold">In PC Folder</span>
               </div>
             )}
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)] overflow-hidden">
            {variantImage ? (
              <img 
                src={variantImage} 
                alt="Variant" 
                className="w-full h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 pointer-events-none" 
              />
            ) : loading ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-600/20 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <p className="text-blue-500 font-bold animate-pulse uppercase tracking-[0.3em] text-[10px]">Processing consistency...</p>
              </div>
            ) : (
              <div className="text-slate-700 text-center space-y-4">
                <div className="w-16 h-16 border-2 border-dashed border-slate-800 rounded-2xl flex items-center justify-center mx-auto opacity-30">
                  <i className="fas fa-layer-group text-2xl"></i>
                </div>
                <p className="text-[11px] font-medium max-w-[200px] leading-relaxed">Seleziona una vista e il ratio per visualizzare qui la variante.</p>
              </div>
            )}
            <PromptOverlay prompt={selectedView ? `GENERATING: ${selectedView} @ ${ratio}` : (variantImage ? `Variante coerente (${ratio})` : '')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDevelopment;
