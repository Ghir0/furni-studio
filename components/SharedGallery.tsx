
import React, { useState } from 'react';
import { Asset } from '../types';
import { Icons } from '../constants';

interface SharedGalleryProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const SharedGallery: React.FC<SharedGalleryProps> = ({ assets, onSelect, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'render' | 'video'>('all');

  const filtered = assets.filter(a => filter === 'all' || a.type === filter);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shared Gallery</h2>
          <p className="text-sm text-slate-400">Cross-access assets across all design phases.</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['all', 'render', 'video'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(asset => (
              <div 
                key={asset.id} 
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-square hover:ring-2 hover:ring-blue-600 transition-all cursor-pointer"
              >
                <img src={asset.url} alt="Asset" className="w-full h-full object-cover" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => onSelect(asset)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase"
                    >
                      Use in Dev
                    </button>
                    <button 
                      onClick={() => onDelete(asset.id)}
                      className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded-lg transition-colors"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>

                <div className="absolute top-2 left-2">
                  <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest text-white border border-white/10">
                    {asset.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800">
              <i className="fas fa-images text-3xl"></i>
            </div>
            <p>Your workspace is empty. Start generating!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGallery;
