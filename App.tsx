
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
    const saved = localStorage.getItem('furni_brand');
    return saved ? JSON.parse(saved) : { name: '', aesthetic: '', systemPrompt: '' };
  });
  const [gallery, setGallery] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('furni_gallery');
    return saved ? JSON.parse(saved) : [];
  });
  const [workspace, setWorkspace] = useState<WorkspaceState>({ handle: null, path: '', status: 'disconnected' });
  const [selectedForDev, setSelectedForDev] = useState<Asset | undefined>(undefined);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('furni_brand', JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    localStorage.setItem('furni_gallery', JSON.stringify(gallery));
  }, [gallery]);

  const handleConnectWorkspace = async () => {
    const handle = await FileSystemService.selectDirectory();
    if (handle) {
      setWorkspace({ handle, path: handle.name, status: 'connected' });
    }
  };

  const handleSaveAsset = async (asset: Asset) => {
    // Prevent duplicate entries in the same session
    if (gallery.some(a => a.url === asset.url)) return;
    
    setGallery(prev => [asset, ...prev]);
    if (workspace.handle && workspace.status === 'connected') {
      try {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        await FileSystemService.saveFile(workspace.handle, 'Renders', `${asset.id}.png`, blob);
      } catch (e) {
        console.error("Workspace save failed", e);
      }
    }
  };

  const handleDeleteAsset = (id: string) => {
    setGallery(prev => prev.filter(a => a.id !== id));
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
          <div className="absolute inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center space-y-6">
             <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
               <i className="fas fa-key text-3xl"></i>
             </div>
             <div>
               <h2 className="text-2xl font-bold">API Access Required</h2>
               <p className="text-slate-400 max-w-md mx-auto mt-2 text-sm leading-relaxed">
                 To use Furniture Studio v2.4, please ensure a valid Google Gemini API Key is configured in your environment.
               </p>
             </div>
             <a 
               href="https://ai.google.dev/gemini-api/docs/billing" 
               target="_blank" 
               className="text-blue-500 hover:text-blue-400 underline text-xs font-bold uppercase tracking-widest"
             >
               Gemini API Billing Docs
             </a>
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
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
