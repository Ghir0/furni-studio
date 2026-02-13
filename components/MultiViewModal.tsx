
import React from 'react';
import { VIEW_TYPES } from '../constants';

interface MultiViewModalProps {
  onClose: () => void;
  onGenerate: (views: string[]) => void;
  selectedViews: string[];
  onToggleView: (view: string) => void;
}

const MultiViewModal: React.FC<MultiViewModalProps> = ({ onClose, onGenerate, selectedViews, onToggleView }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <header className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Consistency Engine</h3>
            <p className="text-xs text-slate-400">Seleziona fino a 4 viste per generare un pacchetto coerente.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-3 custom-scrollbar">
          {VIEW_TYPES.map(view => (
            <button 
              key={view}
              onClick={() => onToggleView(view)}
              className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                selectedViews.includes(view) 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>{view}</span>
              {selectedViews.includes(view) && <i className="fas fa-check-circle"></i>}
            </button>
          ))}
        </div>

        <footer className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Selezione: {selectedViews.length} / 4
            </span>
            {selectedViews.length === 4 && <span className="text-[10px] text-blue-400">Limite raggiunto</span>}
          </div>
          <div className="flex gap-3">
             <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button 
              onClick={() => onGenerate(selectedViews)}
              disabled={selectedViews.length === 0}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Genera Bundle Consistency
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MultiViewModal;
