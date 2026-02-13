
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { Asset, BrandContext, HumanModel } from '../types';
import { VIEW_TYPES } from '../constants';
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
  const [editInstruction, setEditInstruction] = useState("");
  const [models, setModels] = useState<HumanModel[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);
  
  const baseFileRef = useRef<HTMLInputElement>(null);

  const handleUploadBase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBaseImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleView = (view: string) => {
    if (selectedViews.includes(view)) {
      setSelectedViews(prev => prev.filter(v => v !== view));
    } else if (selectedViews.length < 4) {
      setSelectedViews(prev => [...prev, view]);
    }
  };

  const handleApplyEdit = async () => {
    if (!baseImage || !editInstruction) return;
    setLoading(true);
    try {
      const result = await GeminiService.editImage(baseImage, editInstruction);
      setBaseImage(result);
      setEditInstruction("");
    } catch (e) {
      alert("Edit failed");
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

  const handleGenerateBundle = async (views: string[]) => {
    if (!baseImage) return;
    setLoading(true);
    try {
      // In high-level logic, we'd iterate. For this MVP, we process the first selected view.
      const firstView = views[0];
      const prompt = `Generate a ${firstView} view of the furniture piece in this image, maintaining brand DNA: ${brand.systemPrompt}. Ensure lighting and materials are identical to the source image.`;
      const result = await GeminiService.editImage(baseImage, prompt);
      setBaseImage(result);
      setSelectedViews([]);
    } catch (e) {
      alert("Bundle generation failed");
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
          <p className="text-xs text-slate-400">Affina i render, aggiungi modelli umani e gestisci la coerenza.</p>
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

        {/* Human Models Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Human Model System</h3>
            <button 
              onClick={handleAddHumanModel}
              className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/10"
            >
              + Aggiungi Modello
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
            {models.length === 0 && (
              <div className="py-8 border-2 border-dashed border-slate-800 rounded-xl text-center text-slate-600 text-[10px] italic">
                Nessun modello aggiunto.
              </div>
            )}
          </div>
        </section>

        {/* Consistency Engine Section (Moved from Modal to Inline) */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border-2 border-dashed border-slate-800 space-y-4">
          <div className="flex flex-col items-center text-center gap-1 mb-2">
             <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center mb-1">
                <i className="fas fa-th text-blue-500"></i>
             </div>
             <h3 className="text-sm font-bold text-slate-200">Consistency Engine</h3>
             <p className="text-[10px] text-slate-500">Genera fino a 4 viste alternative simultanee</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {VIEW_TYPES.map(view => (
              <button 
                key={view}
                onClick={() => handleToggleView(view)}
                className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all text-left flex items-center justify-between ${
                  selectedViews.includes(view) 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <span className="truncate">{view}</span>
                {selectedViews.includes(view) && <i className="fas fa-check text-[8px]"></i>}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleGenerateBundle(selectedViews)}
            disabled={loading || !baseImage || selectedViews.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <i className="fas fa-layer-group"></i>
            Genera Bundle Viste ({selectedViews.length}/4)
          </button>
        </section>

        {/* Editing Conversazionale */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Editing Conversazionale</h3>
          <div className="space-y-3">
            <textarea 
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Istruzioni inpainting (es. 'Cambia colore tessuto in grigio fumo')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-600 resize-none outline-none"
              rows={3}
            />
            <button 
              onClick={handleApplyEdit}
              disabled={loading || !baseImage || !editInstruction}
              className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg text-[11px]"
            >
              Applica Modifiche Chat
            </button>
          </div>
        </section>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
        <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]">
          {baseImage ? (
            <img src={baseImage} alt="Refined" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-500" />
          ) : (
            <div className="text-slate-600 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-800 opacity-20">
                <i className="fas fa-flask text-4xl"></i>
              </div>
              <p className="text-sm font-medium">Importa o carica un'immagine per iniziare.</p>
            </div>
          )}
        </div>

        {baseImage && (
          <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <button 
               onClick={() => onSaveAsset({
                 id: Math.random().toString(36).substr(2, 9),
                 url: baseImage,
                 type: 'render',
                 timestamp: Date.now(),
                 metadata: { brandStyle: brand.name, prompt: 'Refined development' }
               })}
               className="bg-white/10 hover:bg-blue-600 backdrop-blur-xl p-4 rounded-2xl border border-white/10 transition-all"
               title="Salva Revisione"
            >
              <i className="fas fa-save text-lg"></i>
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-500 font-bold animate-pulse uppercase tracking-[0.3em] text-[10px]">Esecuzione AI Development...</p>
            </div>
          </div>
        )}

        <PromptOverlay prompt={editInstruction ? `EDIT: ${editInstruction}` : (selectedViews.length > 0 ? `VIEWS: ${selectedViews.join(', ')}` : 'Sviluppo attivo...')} />
      </div>
    </div>
  );
};

export default ImageDevelopment;
