import React, { useState } from 'react';
import { ToolType } from './types.ts';
import { ICONS } from './constants.tsx';
import ScriptWriterView from './components/ScriptWriterView.tsx';
import IdeaGeneratorView from './components/IdeaGeneratorView.tsx';
import KeywordResearchView from './components/KeywordResearchView.tsx';
import ThumbnailGeneratorView from './components/ThumbnailGeneratorView.tsx';
import IdeasManagerView from './components/IdeasManagerView.tsx';
import NicheExplorerView from './components/NicheExplorerView.tsx';
import VoiceAssistantView from './components/VoiceAssistantView.tsx';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.SCRIPT_WRITER);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: ToolType.SCRIPT_WRITER, label: 'Script Writer', icon: ICONS.Script },
    { id: ToolType.IDEA_GENERATOR, label: 'Idea Generator', icon: ICONS.Idea },
    { id: ToolType.KEYWORD_RESEARCH, label: 'Keyword Research', icon: ICONS.Search },
    { id: ToolType.NICHE_EXPLORER, label: 'Niche Explorer', icon: ICONS.Trend },
    { id: ToolType.THUMBNAIL_GEN, label: 'Thumbnail Gen', icon: ICONS.Image },
    { id: ToolType.ASSISTANT, label: 'Voice Assistant', icon: ICONS.Mic },
    { id: ToolType.IDEAS_MANAGER, label: 'Ideas Manager', icon: ICONS.Folder },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight">AyoTubeMagic</span>}
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTool === item.id 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-500"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               {sidebarOpen ? <polyline points="11 17 6 12 11 7"/><line x1="18" y1="17" x2="13" y2="12"/><line x1="18" y1="7" x2="13" y2="12"/> : <polyline points="13 17 18 12 13 7"/><line x1="6" y1="17" x2="11" y2="12"/><line x1="6" y1="7" x2="11" y2="12"/>}
             </svg>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-sm z-10">
          <h1 className="text-xl font-semibold text-slate-200">
            {menuItems.find(i => i.id === activeTool)?.label}
          </h1>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">AyoTube Engine</span>
             </div>
             <button className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors">
               <ICONS.Rocket className="w-4 h-4" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {activeTool === ToolType.SCRIPT_WRITER && <ScriptWriterView />}
            {activeTool === ToolType.IDEA_GENERATOR && <IdeaGeneratorView />}
            {activeTool === ToolType.KEYWORD_RESEARCH && <KeywordResearchView />}
            {activeTool === ToolType.NICHE_EXPLORER && <NicheExplorerView />}
            {activeTool === ToolType.THUMBNAIL_GEN && <ThumbnailGeneratorView />}
            {activeTool === ToolType.ASSISTANT && <VoiceAssistantView />}
            {activeTool === ToolType.IDEAS_MANAGER && <IdeasManagerView />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;