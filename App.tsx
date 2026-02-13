
import React, { useState, useEffect } from 'react';
import { AppTab, Asset, BrandContext, WorkspaceState } from './types';
import Sidebar from './components/Sidebar';
import BrandIntelligence from './components/BrandIntelligence';
import ImageGenerator from './components/ImageGenerator';
import ImageDevelopment from './components/ImageDevelopment';
import SharedGallery from './components/SharedGallery';
import { FileSystemService } from './services/fileSystemService';

const App: React.FC = () => {
  // Persistence states
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.BRAND);
  
  const [brand, setBrand] = useState<BrandContext>(() => {
    const saved = localStorage.getItem('furni_brand_v2.4');
    return saved ? JSON.parse(saved) : { 
      name: '', 
      sector: '', 
      market: '', 
      aesthetic: '', 
      systemPrompt: '' 
    };
  });
  
  const [gallery, setGallery] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('furni_gallery_v2.4');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [workspace, setWorkspace] = useState<WorkspaceState>({ 
    handle: null, 
    path: '', 
    status: 'disconnected' 
  });
  
  const [selectedForDev, setSelectedForDev] = useState<Asset | undefined>(undefined);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('furni_brand_v2.4', JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    localStorage.setItem('furni_gallery_v2.4', JSON.stringify(gallery));
  }, [gallery]);

  const handleConnectWorkspace = async () => {
    const handle = await FileSystemService.selectDirectory();
    if (handle) {
      setWorkspace({ handle, path: handle.name, status: 'connected' });
    }
  };

  const handleSaveAsset = async (asset: Asset) => {
    // Prevent duplicate entries in the same session by URL
    if (gallery.some(a => a.url === asset.url)) {
      alert("Asset già presente in galleria.");
      return;
    }
    
    setGallery(prev => [asset, ...prev]);
    
    if (workspace.handle && workspace.status === 'connected') {
      try {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        const success = await FileSystemService.saveFile(workspace.handle, 'Renders', `${asset.id}.png`, blob);
        if (success) {
          console.log(`Saved ${asset.id}.png to workspace`);
        }
      } catch (e) {
        console.error("Workspace save failed", e);
      }
    }
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo asset dalla galleria condivisa?")) {
      setGallery(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAssetSelectForDev = (asset: Asset) => {
    setSelectedForDev(asset);
    setActiveTab(AppTab.DEVELOPMENT);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        workspace={workspace}
        onConnectWorkspace={handleConnectWorkspace}
      />
      
      <main className="flex-1 flex flex-col p-6 lg:p-10 min-w-0 relative">
        {/* API Check Overlay */}
        {!process.env.API_KEY && (
          <div className="absolute inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center space-y-10">
             <div className="relative">
                <div className="w-32 h-32 bg-red-500/10 rounded-[3rem] flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.15)] animate-pulse">
                  <i className="fas fa-lock text-5xl"></i>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-xl">
                   <i className="fas fa-key text-red-400 text-sm"></i>
                </div>
             </div>
             <div className="space-y-4">
               <h2 className="text-4xl font-extrabold tracking-tight">Accesso Riservato</h2>
               <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed font-medium">
                 Furniture Studio v2.4 richiede una chiave API Google Gemini configurata nelle variabili d'ambiente per abilitare il motore di generazione e sviluppo.
               </p>
             </div>
             <div className="flex flex-col gap-4 w-full max-w-xs">
               <a 
                 href="https://ai.google.dev/gemini-api/docs/billing" 
                 target="_blank" 
                 className="bg-white text-black hover:bg-slate-200 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
               >
                 <span>Attiva Fatturazione Gemini</span>
                 <i className="fas fa-external-link-alt"></i>
               </a>
             </div>
          </div>
        )}

        {/* Content Wrapper */}
        <div className="h-full w-full select-text overflow-hidden">
          {activeTab === AppTab.BRAND && (
            <BrandIntelligence context={brand} onUpdate={setBrand} />
          )}
          {activeTab === AppTab.GENERATOR && (
            <ImageGenerator brand={brand} onSaveAsset={handleSaveAsset} />
          )}
          {activeTab === AppTab.DEVELOPMENT && (
            <ImageDevelopment 
              brand={brand} 
              inputAsset={selectedForDev} 
              onSaveAsset={handleSaveAsset} 
            />
          )}
          {activeTab === AppTab.GALLERY && (
            <SharedGallery 
              assets={gallery} 
              onSelect={handleAssetSelectForDev}
              onDelete={handleDeleteAsset}
            />
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default App;
