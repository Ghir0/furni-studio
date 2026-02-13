
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { Asset, BrandContext, ProductReference, LightingType } from '../types';
import { ASPECT_RATIOS, IMAGE_SIZES, LIGHTING_OPTIONS, Icons } from '../constants';
import PromptOverlay from './PromptOverlay';

interface ImageGeneratorProps {
  brand: BrandContext;
  onSaveAsset: (asset: Asset) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ brand, onSaveAsset }) => {
  const [loading, setLoading] = useState(false);
  const [dims, setDims] = useState({ w: 80, h: 45, d: 80 });
  const [ratio, setRatio] = useState("1:1");
  const [size, setSize] = useState("1K");
  const [productDesc, setProductDesc] = useState("");
  const [envDesc, setEnvDesc] = useState("");
  
  // New v2.4 states
  const [productRefs, setProductRefs] = useState<ProductReference[]>([]);
  const [envRefImage, setEnvRefImage] = useState<{url: string, mimeType: string} | null>(null);
  const [lighting, setLighting] = useState<{type: LightingType, customText: string}>({ type: 'Studio', customText: '' });
  
  const [result, setResult] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  
  const productFileRef = useRef<HTMLInputElement>(null);
  const envFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = GeminiService.assembleFurniturePrompt({
      brandStyle: brand.systemPrompt,
      dimensions: dims,
      productRefs: productRefs,
      productDesc: productDesc,
      envRef: envRefImage ? { url: envRefImage.url, description: envDesc } : undefined,
      lighting: { type: lighting.type, custom: lighting.customText },
      models: [],
      view: 'Main Architectural Shot'
    });
    setCurrentPrompt(p);
  }, [brand.systemPrompt, dims, productDesc, envDesc, productRefs, envRefImage, lighting]);

  const handleAddProductRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setProductRefs(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          description: 'Vista prodotto',
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSetEnvRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEnvRefImage({ url: reader.result as string, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Gather all images for the API
      const imagesToPass = [
        ...productRefs.map(r => ({ url: r.url, mimeType: r.mimeType })),
        ...(envRefImage ? [{ url: envRefImage.url, mimeType: envRefImage.mimeType }] : [])
      ];

      const img = await GeminiService.generateImage(currentPrompt, { 
        aspectRatio: ratio, 
        imageSize: size 
      }, imagesToPass);
      
      setResult(img);
    } catch (e) {
      alert("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
      {/* Controls */}
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pr-4 custom-scrollbar pb-10">
        
        {/* Dimensional Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300 uppercase tracking-widest">
            <Icons.Box />
            Controllo Dimensionale
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'w', label: 'Larghezza' },
              { id: 'h', label: 'Altezza' },
              { id: 'd', label: 'Profondità' }
            ].map((dim) => (
              <div key={dim.id} className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 px-1">{dim.label} (cm)</label>
                <input 
                  type="number"
                  value={dims[dim.id as keyof typeof dims]}
                  onChange={(e) => setDims(prev => ({ ...prev, [dim.id]: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Product References Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300 uppercase tracking-widest">
              <i className="fas fa-couch"></i>
              Multi-Reference Prodotto
            </h3>
            <button 
              onClick={() => productFileRef.current?.click()}
              className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1 rounded-lg font-bold hover:bg-blue-600/30 transition-all"
            >
              + Aggiungi Vista
            </button>
            <input type="file" ref={productFileRef} onChange={handleAddProductRef} className="hidden" multiple accept="image/*" />
          </div>
          
          <div className="space-y-3">
            {productRefs.map((ref, idx) => (
              <div key={ref.id} className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex gap-3 animate-in slide-in-from-left-2">
                <img src={ref.url} className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Vista {idx + 1}</span>
                    <button onClick={() => setProductRefs(prev => prev.filter(r => r.id !== ref.id))} className="text-slate-600 hover:text-red-500 transition-colors">
                      <i className="fas fa-times-circle text-xs"></i>
                    </button>
                  </div>
                  <input 
                    className="w-full bg-transparent border-b border-slate-800 focus:border-blue-600 text-[11px] py-1 outline-none text-slate-300"
                    placeholder="Descrivi questa vista (es. vista frontale tessitura)..."
                    value={ref.description}
                    onChange={(e) => {
                      const newRefs = [...productRefs];
                      newRefs[idx].description = e.target.value;
                      setProductRefs(newRefs);
                    }}
                  />
                </div>
              </div>
            ))}
            <textarea 
              rows={2}
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Descrizione prodotto generale (es. divano modulare in velluto verde bosco)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-600 resize-none"
            />
          </div>
        </section>

        {/* Environment & Lighting Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300 uppercase tracking-widest">
            <Icons.Camera />
            Ambiente e Luci
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => envFileRef.current?.click()}
                className="flex-1 h-24 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-slate-700 hover:bg-slate-900/50 transition-all overflow-hidden relative"
              >
                {envRefImage ? (
                  <>
                    <img src={envRefImage.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    <span className="relative z-10 text-[10px] font-bold bg-black/60 px-2 py-1 rounded">Cambia Foto Ambiente</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-image text-slate-600"></i>
                    <span className="text-[10px] font-bold text-slate-500">Upload Foto Ambiente</span>
                  </>
                )}
              </button>
              <input type="file" ref={envFileRef} onChange={handleSetEnvRef} className="hidden" accept="image/*" />
            </div>

            <textarea 
              rows={2}
              value={envDesc}
              onChange={(e) => setEnvDesc(e.target.value)}
              placeholder="Dettagli ambiente (es. attico moderno, luce pomeridiana)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-600 resize-none"
            />

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                <Icons.Light /> Lighting Engine
              </label>
              <select 
                value={lighting.type}
                onChange={(e) => setLighting(prev => ({ ...prev, type: e.target.value as LightingType }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 outline-none"
              >
                {LIGHTING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              {lighting.type === 'Custom' && (
                <input 
                  type="text"
                  placeholder="Inserisci setup manuale luci..."
                  value={lighting.customText}
                  onChange={(e) => setLighting(prev => ({ ...prev, customText: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 outline-none animate-in fade-in"
                />
              )}
            </div>
          </div>
        </section>

        {/* Global Config Section */}
        <section className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Aspect Ratio</label>
              <select 
                value={ratio} 
                onChange={(e) => setRatio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs"
              >
                {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Output Size</label>
              <select 
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs"
              >
                {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        <button 
          onClick={handleGenerate}
          disabled={loading || !brand.systemPrompt}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 sticky bottom-0 z-20"
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
          {brand.systemPrompt ? 'Genera Render 1-Shot' : 'Configura Brand Prima'}
        </button>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
        <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]">
          {result ? (
            <div className="relative w-full h-full flex items-center justify-center">
               <img src={result} alt="Generation result" className="max-w-full max-h-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] object-contain animate-in zoom-in-95 duration-700" />
            </div>
          ) : (
            <div className="text-slate-600 text-center space-y-6 max-w-sm">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto border border-slate-800 shadow-inner">
                <i className="fas fa-image text-4xl opacity-20"></i>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-slate-400">Preview Render</p>
                <p className="text-xs text-slate-500 leading-relaxed">Configura le reference e il setup luci per iniziare a visualizzare il tuo arredo.</p>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300">
            <button 
              onClick={() => onSaveAsset({
                id: Math.random().toString(36).substr(2, 9),
                url: result,
                type: 'render',
                timestamp: Date.now(),
                metadata: { brandStyle: brand.name, prompt: currentPrompt, dimensions: dims }
              })}
              className="bg-white/10 hover:bg-blue-600 backdrop-blur-xl p-4 rounded-2xl border border-white/10 transition-all shadow-xl"
              title="Salva in Galleria Condivisa"
            >
              <i className="fas fa-save text-lg"></i>
            </button>
            <a 
              href={result} 
              download={`render-${Date.now()}.png`}
              className="bg-white/10 hover:bg-green-600 backdrop-blur-xl p-4 rounded-2xl border border-white/10 transition-all shadow-xl flex items-center justify-center"
              title="Download Render"
            >
              <i className="fas fa-download text-lg"></i>
            </a>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-600/20 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-blue-500 font-bold uppercase tracking-[0.2em] text-sm animate-pulse">Sviluppo Immagine...</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Utilizzando Gemini 3 Pro Vision</p>
              </div>
            </div>
          </div>
        )}

        <PromptOverlay prompt={currentPrompt} />
      </div>
    </div>
  );
};

export default ImageGenerator;
