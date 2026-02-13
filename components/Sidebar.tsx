
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
  const [width, setWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(180, Math.min(450, e.clientX));
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
      className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col relative transition-colors duration-300"
      style={{ width }}
    >
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <i className="fas fa-couch text-white text-sm"></i>
        </div>
        <h1 className="font-bold text-lg tracking-tight truncate">Furni Studio <span className="text-blue-500">v2.4</span></h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Workspace</span>
            <span className={`w-2 h-2 rounded-full ${workspace.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
          </div>
          <p className="text-xs text-slate-400 truncate mb-3">{workspace.path || 'No workspace connected'}</p>
          <button 
            onClick={onConnectWorkspace}
            className="w-full text-xs bg-slate-800 hover:bg-slate-700 py-2 rounded-lg font-medium transition-colors border border-slate-700"
          >
            {workspace.status === 'connected' ? 'Change Folder' : 'Connect Folder'}
          </button>
        </div>
        
        <div className="flex items-center justify-between px-2 text-slate-500 text-xs hover:text-white transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Icons.Settings />
            <span>Settings</span>
          </div>
          <i className="fas fa-chevron-right text-[10px]"></i>
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-600/50 active:bg-blue-600 transition-colors"
      />
    </aside>
  );
};

export default Sidebar;
