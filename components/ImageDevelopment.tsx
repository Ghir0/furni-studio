
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { Asset, BrandContext, HumanModel } from '../types';
import PromptOverlay from './PromptOverlay';
import ModelCard from './ModelCard';
import MultiViewModal from './MultiViewModal';

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
  const [showMultiViewModal, setShowMultiViewModal] = useState(false);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);

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
    // In a real scenario, we'd loop or use a batch API. For now, simulate first view.
    try {
      const firstView = views[0];
      const prompt = `Generate a ${firstView} view of the furniture piece in this image, keeping consistency with ${brand.systemPrompt}.`;
      const result = await GeminiService.editImage(baseImage, prompt);
      setBaseImage(result);
      setShowMultiViewModal(false);
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
          <p className="text-xs text-slate-400">Affina i render, aggiungi modelli umani e genera viste alternative coerenti.</p>
        </header>

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
                Nessun modello aggiunto. Clicca "+" per inserire un soggetto umano.
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Editing Conversazionale</h3>
          <div className="space-y-3">
            <textarea 
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Istruzioni inpainting (es. 'Aggiungi un tappeto in lana grezza', 'Cambia luce in notturna')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-600 resize-none outline-none"
              rows={3}
            />
            <button 
              onClick={handleApplyEdit}
              disabled={loading || !baseImage || !editInstruction}
              className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg"
            >
              Applica Modifiche via Chat
            </button>
          </div>
        </section>

        <section className="">
          <button 
            onClick={() => setShowMultiViewModal(true)}
            disabled={!baseImage}
            className="w-full border-2 border-dashed border-slate-800 hover:border-blue-600/50 hover:bg-blue-600/5 py-6 rounded-2xl flex flex-col items-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fas fa-th text-blue-500"></i>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold block">Consistency Engine</span>
              <span className="text-[10px] text-slate-500">Genera fino a 4 viste alternative simultanee</span>
            </div>
          </button>
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
              <p className="text-sm font-medium">Importa un render per iniziare lo sviluppo e la coerenza.</p>
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

        <PromptOverlay prompt={editInstruction ? `EDIT: ${editInstruction}` : 'Sviluppo attivo...'} />
      </div>

      {showMultiViewModal && (
        <MultiViewModal 
          selectedViews={selectedViews}
          onToggleView={handleToggleView}
          onClose={() => setShowMultiViewModal(false)}
          onGenerate={handleGenerateBundle}
        />
      )}
    </div>
  );
};

export default ImageDevelopment;
