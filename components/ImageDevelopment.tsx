
import React, { useState, useEffect } from 'react';
import { GeminiService, assembleFurniturePrompt } from '../services/geminiService';
import { Asset, BrandContext, HumanModel } from '../types';
import { VIEW_TYPES } from '../constants';
import PromptOverlay from './PromptOverlay';

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

  const handleAddView = (view: string) => {
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
      interaction: 'sitting comfortably on the product'
    };
    setModels(prev => [...prev, newModel]);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full">
      {/* Dev Controls */}
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4">
        <header className="space-y-1">
          <h2 className="text-xl font-bold">Image Development</h2>
          <p className="text-xs text-slate-400">Refine renders, add human models, and generate consistent alternative views.</p>
        </header>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Human Models</h3>
            <button 
              onClick={handleAddHumanModel}
              className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1 rounded-full font-bold hover:bg-blue-600/30 transition-all"
            >
              + Add Model
            </button>
          </div>
          <div className="space-y-3">
            {models.map((model, idx) => (
              <div key={model.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3 relative group">
                <button 
                  onClick={() => setModels(prev => prev.filter(m => m.id !== model.id))}
                  className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-950 p-1 rounded-lg">
                    <button 
                      onClick={() => {
                        const newModels = [...models];
                        newModels[idx].gender = 'female';
                        setModels(newModels);
                      }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${model.gender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >Woman</button>
                    <button 
                      onClick={() => {
                        const newModels = [...models];
                        newModels[idx].gender = 'male';
                        setModels(newModels);
                      }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${model.gender === 'male' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >Man</button>
                  </div>
                </div>
                <input 
                  type="text" 
                  value={model.interaction}
                  onChange={(e) => {
                    const newModels = [...models];
                    newModels[idx].interaction = e.target.value;
                    setModels(newModels);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300"
                  placeholder="Interaction (e.g. leaning against...)"
                />
              </div>
            ))}
            {models.length === 0 && <p className="text-center text-slate-600 text-[10px] italic">No models added to this project.</p>}
          </div>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Conversational Editing</h3>
          <div className="space-y-2">
            <textarea 
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Inpainting prompt (e.g. 'Add a wool throw blanket', 'Change lighting to night')..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-600 resize-none"
              rows={3}
            />
            <button 
              onClick={handleApplyEdit}
              disabled={loading || !baseImage || !editInstruction}
              className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              Apply Edit Instructions
            </button>
          </div>
        </section>

        <section className="pt-4 border-t border-slate-800">
          <button 
            onClick={() => setShowMultiViewModal(true)}
            className="w-full border-2 border-dashed border-slate-800 hover:border-blue-600/50 hover:bg-blue-600/5 py-4 rounded-xl flex flex-col items-center gap-1 transition-all"
          >
            <i className="fas fa-th text-blue-500"></i>
            <span className="text-xs font-bold">Consistency Engine</span>
            <span className="text-[10px] text-slate-500">Generate multiple views at once</span>
          </button>
        </section>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative group">
        <div className="flex-1 flex items-center justify-center p-8">
          {baseImage ? (
            <img src={baseImage} alt="Refined" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" />
          ) : (
            <div className="text-slate-600 text-center space-y-4">
              <i className="fas fa-flask text-4xl"></i>
              <p className="text-sm">Import an image from the generator or gallery to start refining.</p>
            </div>
          )}
        </div>

        {baseImage && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
               onClick={() => onSaveAsset({
                 id: Math.random().toString(36).substr(2, 9),
                 url: baseImage,
                 type: 'render',
                 timestamp: Date.now(),
                 metadata: { brandStyle: brand.name, prompt: 'Refined development' }
               })}
               className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/10"
            >
              <i className="fas fa-save"></i>
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <i className="fas fa-circle-notch fa-spin text-4xl text-blue-500"></i>
              <p className="text-blue-500 font-bold animate-pulse uppercase tracking-widest text-xs">Processing Refinement...</p>
            </div>
          </div>
        )}
      </div>

      {/* Multi-View Modal */}
      {showMultiViewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <header className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Consistency Engine</h3>
                <p className="text-xs text-slate-400">Select up to 4 views to generate simultaneously.</p>
              </div>
              <button onClick={() => setShowMultiViewModal(false)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times text-xl"></i>
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {VIEW_TYPES.map(view => (
                <button 
                  key={view}
                  onClick={() => handleAddView(view)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                    selectedViews.includes(view) 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            <footer className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {selectedViews.length} / 4 Selected
              </div>
              <button 
                disabled={selectedViews.length === 0}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg"
              >
                Generate Bundle
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDevelopment;
