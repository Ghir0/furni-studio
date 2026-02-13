
import React, { useState, useCallback, useEffect } from 'react';
import { AppTab, WorkspaceState } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  workspace: WorkspaceState;
  onConnectWorkspace: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, workspace, onConnectWorkspace }) => {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('furni_sidebar_width');
    return saved ? parseInt(saved) : 280;
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem('furni_sidebar_width', width.toString());
  }, [width]);
  
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(220, Math.min(480, e.clientX));
      setWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const navItems = [
    { id: AppTab.BRAND, label: 'Brand Intelligence', icon: Icons.Brand },
    { id: AppTab.GENERATOR, label: 'Image Generator', icon: Icons.Generator },
    { id: AppTab.DEVELOPMENT, label: 'Image Development', icon: Icons.Development },
    { id: AppTab.GALLERY, label: 'Shared Gallery', icon: Icons.Gallery },
  ];

  return (
    <aside 
      className={`h-screen bg-slate-950 border-r border-slate-800/60 flex flex-col relative transition-colors duration-300 z-[100] ${isResizing ? 'select-none' : ''}`}
      style={{ width }}
    >
      <div className="p-8 flex items-center gap-4 border-b border-slate-800/40">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
          <i className="fas fa-chair text-white text-lg"></i>
        </div>
        <div className="flex flex-col min-w-0">
          <h1 className="font-black text-sm tracking-[0.2em] uppercase truncate text-white">Furni Studio</h1>
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">AI SaaS v2.4</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
            }`}
          >
            <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              <item.icon />
            </span>
            <span className="font-bold text-[13px] tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800/40 space-y-6">
        <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Workspace</span>
            <div className={`w-2 h-2 rounded-full ${workspace.status === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-300 truncate">{workspace.path || 'No local folder selected'}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">{workspace.status === 'connected' ? 'Connected' : 'Disconnected'}</p>
          </div>
          <button 
            onClick={onConnectWorkspace}
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white py-3 rounded-xl transition-all border border-slate-800 hover:border-slate-700"
          >
            {workspace.status === 'connected' ? 'Switch Folder' : 'Connect Workspace'}
          </button>
        </div>
        
        <div className="flex items-center justify-between px-3 text-slate-500 hover:text-white transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <Icons.Settings />
            <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
          </div>
          <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className={`absolute top-0 right-0 w-[3px] h-full cursor-col-resize hover:bg-blue-600 active:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-600' : ''}`}
      />
    </aside>
  );
};

export default Sidebar;
