
import React, { useState } from 'react';
import { VIEW_TYPES } from '../constants';

interface MultiViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedViews: string[]) => void;
  loading?: boolean;
}

const MultiViewModal: React.FC<MultiViewModalProps> = ({ isOpen, onClose, onConfirm, loading }) => {
  const [selected, setSelected] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleView = (view: string) => {
    if (selected.includes(view)) {
      setSelected(selected.filter(v => v !== view));
    } else if (selected.length < 1) {
      setSelected([...selected, view]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        <header className="p-8 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Consistency Engine</h3>
            <p className="text-xs text-slate-400 mt-1">Seleziona la vista alternativa per la generazione.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </header>

        <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[50vh] custom-scrollbar">
          {VIEW_TYPES.map(view => {
            const isSelected = selected.includes(view);
            return (
              <button
                key={view}
                onClick={() => toggleView(view)}
                className={`p-4 rounded-2xl border text-sm font-bold text-left transition-all relative ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {view}
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    {selected.indexOf(view) + 1}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {selected.length} / 1 Selezionata
          </span>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button 
              disabled={selected.length === 0 || loading}
              onClick={() => onConfirm(selected)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {loading && <i className="fas fa-spinner fa-spin"></i>}
              Avvia Generazione Vista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiViewModal;
