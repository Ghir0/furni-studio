
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService, assembleFurniturePrompt, ImageRef } from '../services/geminiService';
import { Asset, BrandContext } from '../types';
import { ASPECT_RATIOS, IMAGE_SIZES } from '../constants';
import PromptOverlay from './PromptOverlay';

interface ProductViewRef {
  id: string;
  data: string;
  mimeType: string;
  description: string;
}

interface ImageGeneratorProps {
  brand: BrandContext;
  onSaveAsset: (asset: Asset) => void;
}

const LIGHTING_OPTIONS = [
  { id: 'soft', label: 'Soft (Morbida)', prompt: 'Soft, diffused lighting with gentle shadows.' },
  { id: 'studio', label: 'Studio (Professionale)', prompt: 'Professional studio lighting, high-key, clean highlights.' },
  { id: 'natural', label: 'Natural (Luce Naturale)', prompt: 'Natural sunlight, warm golden hour atmosphere, realistic shadows.' },
  { id: 'dramatic', label: 'Dramatic (Contrastata)', prompt: 'Dramatic lighting, high contrast, moody shadows, cinematic chiaroscuro.' },
  { id: 'custom', label: 'Custom (Manuale)', prompt: '' },
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ brand, onSaveAsset }) => {
  const [loading, setLoading] = useState(false);
  const [dims, setDims] = useState({ w: 80, h: 45, d: 80 });
  const [ratio, setRatio] = useState("1:1");
  const [size, setSize] = useState("1K");
  const [productDesc, setProductDesc] = useState("");
  const [envDesc, setEnvDesc] = useState("");
  
  // Lighting state
  const [lightingType, setLightingType] = useState('studio');
  const [customLighting, setCustomLighting] = useState('');

  // Image References
  const [envRef, setEnvRef] = useState<{ data: string; mimeType: string } | null>(null);
  const [productRefs, setProductRefs] = useState<ProductViewRef[]>([]);
  
  const [result, setResult] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const envInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selectedLighting = LIGHTING_OPTIONS.find(l => l.id === lightingType);
    const lightingPrompt = lightingType === 'custom' ? customLighting : selectedLighting?.prompt;

    const p = assembleFurniturePrompt({
      brandStyle: brand.systemPrompt,
      dimensions: dims,
      productText: productDesc,
      envText: envDesc,
      lighting: lightingPrompt,
      hasProductRefs: productRefs.length > 0,
      hasEnvRef: !!envRef,
      models: [],
      view: 'Main Shot'
    });
    setCurrentPrompt(p);
  }, [brand.systemPrompt, dims, productDesc, envDesc, productRefs.length, envRef, lightingType, customLighting]);

  const toBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          data: result.split(',')[1],
          mimeType: file.type
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleEnvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Data = await toBase64(file);
      setEnvRef(base64Data);
    }
  };

  const handleProductRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64Data = await toBase64(file);
      const newRef: ProductViewRef = {
        id: Math.random().toString(36).substr(2, 9),
        data: base64Data.data,
        mimeType: base64Data.mimeType,
        description: ""
      };
      setProductRefs(prev => [...prev, newRef]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateProductRefDesc = (id: string, description: string) => {
    setProductRefs(prev => prev.map(ref => ref.id === id ? { ...ref, description } : ref));
  };

  const removeProductRef = (id: string) => {
    setProductRefs(prev => prev.filter(ref => ref.id !== id));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const refsForApi: ImageRef[] = productRefs.map(r => ({
        data: r.data,
        mimeType: r.mimeType,
        description: r.description
      }));

      const img = await GeminiService.generateImage(
        currentPrompt, 
        { aspectRatio: ratio, imageSize: size },
        refsForApi,
        envRef || undefined
      );
      setResult(img);
    } catch (e) {
      alert("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-full">
      {/* Controls */}
      <div className="lg:col-span-5 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
        {/* Dimensional Controls */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Dimensional Controls</h3>
          <div className="grid grid-cols-3 gap-3">
            {['w', 'h', 'd'].map((dim) => (
              <div key={dim} className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 px-1">
                  {dim === 'w' ? 'Width' : dim === 'h' ? 'Height' : 'Depth'} (cm)
                </label>
                <input 
                  type="number"
                  value={dims[dim as keyof typeof dims]}
                  onChange={(e) => setDims(prev => ({ ...prev, [dim]: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Product References Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Riferimenti Prodotto</h3>
          <div className="space-y-4">
            {productRefs.map((ref) => (
              <div key={ref.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex gap-4 relative group">
                <button 
                  onClick={() => removeProductRef(ref.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <i className="fas fa-times"></i>
                </button>
                <div className="w-20 h-20 bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                  <img src={`data:${ref.mimeType};base64,${ref.data}`} alt="Product ref" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <textarea 
                    value={ref.description}
                    onChange={(e) => updateProductRefDesc(ref.id, e.target.value)}
                    placeholder="Descrivi questa vista (es: Dettaglio gambe in ottone, retro schienale)..."
                    className="w-full h-full bg-transparent text-xs text-slate-300 focus:outline-none resize-none"
                  />
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-blue-600/20 bg-blue-600/5 hover:bg-blue-600/10 hover:border-blue-600/40 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                <i className="fas fa-plus"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Aggiungi Vista</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProductRefUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </button>
          </div>
          <textarea 
            rows={2}
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            placeholder="Descrizione testuale aggiuntiva del prodotto..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </section>

        {/* Environment Reference Section */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Reference Ambientale (Foto)</h3>
          {envRef ? (
            <div className="relative group aspect-video bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <img src={`data:${envRef.mimeType};base64,${envRef.data}`} alt="Env reference" className="w-full h-full object-cover" />
              <button 
                onClick={() => setEnvRef(null)}
                className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-2 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => envInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-emerald-600/20 bg-emerald-600/5 hover:bg-emerald-600/10 hover:border-emerald-600/40 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
            >
              <i className="fas fa-mountain text-emerald-500 text-2xl"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Carica Reference Scena</span>
              <input 
                type="file" 
                ref={envInputRef} 
                onChange={handleEnvUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </button>
          )}
          <p className="text-[10px] text-slate-500 italic px-1">L'AI userà questa foto per guidare lo stile e l'atmosfera dell'ambiente.</p>
          <textarea 
            rows={2}
            value={envDesc}
            onChange={(e) => setEnvDesc(e.target.value)}
            placeholder="Descrizione testuale dell'ambiente (es: Loft industriale)..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </section>

        {/* Technical Config */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Setup Luci</h3>
          <div className="space-y-3">
            <select 
              value={lightingType} 
              onChange={(e) => setLightingType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600"
            >
              {LIGHTING_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            
            {lightingType === 'custom' && (
              <textarea 
                rows={2}
                value={customLighting}
                onChange={(e) => setCustomLighting(e.target.value)}
                placeholder="Specifica il tipo di luce (es: Luce soffusa laterale, toni caldi)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-600 resize-none animate-in fade-in slide-in-from-top-2 duration-300"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Aspect Ratio</label>
              <select 
                value={ratio} 
                onChange={(e) => setRatio(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Output Size</label>
              <select 
                value={size} 
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                {IMAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 sticky bottom-0 z-20"
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
          Generate 1-Shot Render
        </button>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative group">
        <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
          {result ? (
            <img src={result} alt="Generation result" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain animate-in zoom-in-95 duration-500" />
          ) : (
            <div className="text-slate-600 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                <i className="fas fa-image text-3xl"></i>
              </div>
              <p className="text-sm font-medium">Ready to visualize. Adjust parameters and click generate.</p>
            </div>
          )}
        </div>

        {result && (
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onSaveAsset({
                id: Math.random().toString(36).substr(2, 9),
                url: result,
                type: 'render',
                timestamp: Date.now(),
                metadata: { brandStyle: brand.name, prompt: currentPrompt, dimensions: dims }
              })}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/10 transition-colors"
              title="Save to Gallery"
            >
              <i className="fas fa-save"></i>
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/10 transition-colors" title="Download">
              <i className="fas fa-download"></i>
            </button>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-500 font-bold uppercase tracking-widest text-xs animate-pulse">Rendering Design...</p>
          </div>
        )}

        <PromptOverlay prompt={currentPrompt} />
      </div>
    </div>
  );
};

export default ImageGenerator;
