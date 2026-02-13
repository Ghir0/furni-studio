
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Asset, BrandContext, HumanModel } from '../types';
import { VIEW_TYPES, ASPECT_RATIOS } from '../constants';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(inputAsset?.url || null);
  const [visualDNA, setVisualDNA] = useState<string>("");
  const [editInstruction, setEditInstruction] = useState("");
  const [livePrompt, setLivePrompt] = useState<string>("");
  const [models, setModels] = useState<HumanModel[]>([]);
  const [ratio, setRatio] = useState("1:1");
  const [isMultiViewOpen, setIsMultiViewOpen] = useState(false);
  
  const baseFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputAsset?.url) {
      setBaseImage(inputAsset.url);
      setVisualDNA(""); 
      setLivePrompt("ASSET_LOADED: Ready for DNA analysis or view generation.");
    }
  }, [inputAsset]);

  const handleAnalyzeSource = async () => {
    if (!baseImage) return;
    setAnalyzing(true);
    setLivePrompt("ANALYZING_DNA: Extracting structural identity to decouple perspective...");
    try {
      const desc = await GeminiService.describeImage(baseImage);
      setVisualDNA(desc);
      setLivePrompt(`IDENTITY_EXTRACTED: ${desc}`);
    } catch (e) {
      console.error("Analysis failed", e);
      setLivePrompt("ERROR: DNA analysis failed.");
      alert("Analisi del DNA fallita. Riprova.");
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
      setLivePrompt("MANUAL_UPLOAD: External source detected.");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyEdit = async () => {
    if (!baseImage || !editInstruction) return;
    setLoading(true);
    
    const fullEditPrompt = `[BRAND_CONTEXT]: ${brand.systemPrompt}. [IDENTITY]: ${visualDNA || 'Consistent with source'}. [ACTION]: ${editInstruction}. ${models.length > 0 ? `[HUMANS]: ${models.map(m => `${m.gender} ${m.interaction}`).join(', ')}` : ''}`;
    setLivePrompt(fullEditPrompt);

    try {
      const result = await GeminiService.editImage(baseImage, fullEditPrompt, { aspectRatio: ratio });
      if (result) {
        setBaseImage(result);
        setEditInstruction("");
        onSaveAsset({
          id: `edit-${Date.now()}`,
          url: result,
          type: 'render',
          timestamp: Date.now(),
          metadata: { brandStyle: brand.name, prompt: fullEditPrompt }
        });
        setLivePrompt(`SUCCESS: Inpainting applied.`);
      }
    } catch (e) {
      console.error("Edit failed", e);
      setLivePrompt("ERROR: Inpainting failed.");
      alert("Impossibile applicare la modifica.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMultiView = async (selectedViews: string[]) => {
    if (!baseImage) return;
    setLoading(true);
    setIsMultiViewOpen(false);

    try {
      let dna = visualDNA;
      if (!dna) {
        setAnalyzing(true);
        setLivePrompt("PRE_FLIGHT_ANALYSIS: Ensuring structural consistency...");
        dna = await GeminiService.describeImage(baseImage);
        setVisualDNA(dna);
        setAnalyzing(false);
      }

      for (const view of selectedViews) {
        const prompt = GeminiService.assembleConsistencyPrompt(view, brand.systemPrompt, dna);
        setLivePrompt(`GENERATING_PERSPECTIVE [${view}]: ${prompt}`);
        
        // We use generateImage (Pro model) for perspective shifts as it handles 
        // composition changes better than simple inpainting/editing models.
        const result = await GeminiService.generateImage(prompt, { 
          aspectRatio: ratio, 
          imageSize: "1K" 
        }, [{ url: baseImage, mimeType: "image/png" }]);
        
        if (result) {
          onSaveAsset({
            id: `cons-${view.replace(/\s/g, '-')}-${Date.now()}`,
            url: result,
            type: 'render',
            timestamp: Date.now(),
            metadata: { brandStyle: brand.name, prompt: prompt, viewName: view }
          });
        }
      }
      setLivePrompt("SUCCESS: Perspective bundle completed.");
      alert(`Generate ${selectedViews.length} viste con successo.`);
    } catch (e) {
      console.error("Multi-view generation failed", e);
      setLivePrompt("ERROR: Generation failed. Check API limits.");
      alert("Errore durante la generazione.");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
        <header className="space-y-1">
          <h2 className="text-xl font-bold">Sviluppo Immagine</h2>
          <p className="text-xs text-slate-400">Affina i render e gestisci la coerenza del prodotto.</p>
        </header>

        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Asset Sorgente</h3>
            {baseImage && (
              <button 
                onClick={handleAnalyzeSource}
                disabled={analyzing || loading}
                className={`text-[10px] px-3 py-1.5 rounded-lg font-bold border transition-all flex items-center gap-2 ${visualDNA ? 'bg-green-600/20 border-green-600/40 text-green-400' : 'bg-blue-600/20 border-blue-600/40 text-blue-400 hover:bg-blue-600/30'}`}
              >
                {analyzing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microscope"></i>}
                {visualDNA ? 'DNA Analizzato' : 'Analizza DNA'}
              </button>
            )}
          </div>
          <button 
            onClick={() => baseFileRef.current?.click()}
            className="w-full h-40 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all overflow-hidden relative"
          >
            {baseImage ? (
              <img src={baseImage} className="absolute inset-0 w-full h-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <i className="fas fa-upload text-slate-600 text-xl"></i>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Carica Render Base</span>
              </div>
            )}
          </button>
          <input type="file" ref={baseFileRef} onChange={handleUploadBase} className="hidden" accept="image/*" />
          
          {visualDNA && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 animate-in slide-in-from-top-2">
              <span className="text-[9px] uppercase font-bold text-slate-600 block mb-2 flex items-center gap-2">
                <i className="fas fa-dna"></i> Visual DNA
              </span>
              <p className="text-[11px] text-slate-400 italic leading-relaxed">{visualDNA}</p>
            </div>
          )}
        </section>

        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Configurazione Output</h3>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 px-1">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  className={`text-[10px] py-2 rounded-lg border transition-all font-bold ${
                    ratio === r 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <i className="fas fa-user-friends"></i> Model System
            </h3>
            <button 
              onClick={() => setModels([...models, { id: Math.random().toString(36).substr(2, 9), gender: 'female', interaction: 'posa rilassata' }])}
              className="text-[10px] bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700"
            >
              + Aggiungi
            </button>
          </div>
          <div className="space-y-3">
            {models.map(m => (
              <ModelCard 
                key={m.id} 
                model={m} 
                onUpdate={(u) => setModels(models.map(x => x.id === u.id ? u : x))} 
                onRemove={() => setModels(models.filter(x => x.id !== m.id))} 
              />
            ))}
          </div>
        </section>

        <button 
          onClick={() => setIsMultiViewOpen(true)}
          disabled={!baseImage || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-indigo-400/30"
        >
          <i className="fas fa-th-large"></i>
          Genera Viste Coerenti
        </button>

        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <i className="fas fa-comment-dots"></i> Inpainting Chat
          </h3>
          <textarea 
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            placeholder="Descrivi la modifica (es. 'aggiungi un cuscino', 'cambia il pavimento')..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-xs focus:ring-1 focus:ring-blue-600 resize-none text-slate-300 min-h-[100px]"
          />
          <button 
            onClick={handleApplyEdit}
            disabled={loading || !baseImage || !editInstruction}
            className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-[11px] uppercase tracking-widest"
          >
            Invia Richiesta Edit
          </button>
        </section>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col group">
          <div className="p-5 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preview Sviluppo Immagine</span>
             </div>
             {(analyzing || loading) && (
               <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-600/10 border border-blue-600/30 rounded-full animate-in fade-in">
                  <i className="fas fa-circle-notch fa-spin text-blue-500 text-xs"></i>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                    {analyzing ? 'Analysis DNA...' : 'Generating Render...'}
                  </span>
               </div>
             )}
          </div>
          
          <div className="flex-1 relative flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] overflow-hidden">
            {baseImage ? (
              <img 
                src={baseImage} 
                alt="Base" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-700 animate-in zoom-in-95" 
              />
            ) : (
              <div className="text-slate-800 text-center space-y-6 max-w-sm">
                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-800/50 shadow-inner">
                  <i className="fas fa-image text-4xl opacity-10"></i>
                </div>
                <div className="space-y-2">
                   <p className="text-lg font-bold text-slate-500">Nessuna Sorgente</p>
                   <p className="text-xs text-slate-600 leading-relaxed">Carica un render per iniziare.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-40 flex items-center justify-center transition-all animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest animate-pulse">Synthesis in Progress...</p>
                </div>
              </div>
            )}
            
            <PromptOverlay prompt={livePrompt} />
          </div>
          
          {baseImage && (
            <div className="p-6 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                  <i className="fas fa-expand-arrows-alt"></i> {ratio}
                </div>
              </div>
              <button 
                onClick={() => onSaveAsset({
                  id: `dev-${Date.now()}`,
                  url: baseImage,
                  type: 'render',
                  timestamp: Date.now(),
                  metadata: { brandStyle: brand.name, prompt: livePrompt }
                })}
                className="text-[10px] bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest"
              >
                Salva Revisione
              </button>
            </div>
          )}
        </div>
      </div>

      <MultiViewModal 
        isOpen={isMultiViewOpen} 
        onClose={() => setIsMultiViewOpen(false)} 
        onConfirm={handleGenerateMultiView}
        loading={loading}
      />
    </div>
  );
};

export default ImageDevelopment;
