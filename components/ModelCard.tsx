
import React from 'react';
import { HumanModel } from '../types';

interface ModelCardProps {
  model: HumanModel;
  onUpdate: (updated: HumanModel) => void;
  onRemove: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, onUpdate, onRemove }) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3 relative group animate-in slide-in-from-right-2">
      <button 
        onClick={onRemove}
        className="absolute top-2 right-2 text-slate-600 hover:text-red-500 transition-colors"
      >
        <i className="fas fa-times text-xs"></i>
      </button>
      
      <div className="flex items-center gap-3">
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => onUpdate({ ...model, gender: 'female' })}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${model.gender === 'female' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:text-white'}`}
          >Donna</button>
          <button 
            onClick={() => onUpdate({ ...model, gender: 'male' })}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${model.gender === 'male' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-white'}`}
          >Uomo</button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase font-bold text-slate-500 px-1">Interazione / Azione</label>
        <input 
          type="text" 
          value={model.interaction}
          onChange={(e) => onUpdate({ ...model, interaction: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-blue-600 outline-none"
          placeholder="es. seduta comodamente sul divano leggendo..."
        />
      </div>
    </div>
  );
};

export default ModelCard;
