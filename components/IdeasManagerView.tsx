
import React, { useEffect, useState } from 'react';
import { ScriptVersion } from '../types';

const IdeasManagerView: React.FC = () => {
  const [savedScripts, setSavedScripts] = useState<ScriptVersion[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('tubemagic_saved_scripts');
    if (raw) {
      setSavedScripts(JSON.parse(raw));
    }
  }, []);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const deleteScript = (id: string) => {
    const updated = savedScripts.filter(s => s.id !== id);
    setSavedScripts(updated);
    localStorage.setItem('tubemagic_saved_scripts', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Content Pipeline</h2>
          <p className="text-sm text-slate-400">Manage your generated scripts and content workflow.</p>
        </div>
        <button className="bg-indigo-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">+ New Project</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Researching Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Researching</span>
            <span className="text-[10px] bg-slate-800 px-2 rounded-full text-slate-400">0</span>
          </div>
          <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-700 min-h-[150px]">
             <span className="text-xs">No research projects yet</span>
          </div>
        </div>

        {/* Drafting Column (Active Scripts) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Drafting</span>
            <span className="text-[10px] bg-indigo-600/20 px-2 rounded-full text-indigo-400 font-bold">{savedScripts.length}</span>
          </div>
          
          <div className="space-y-3 min-h-[300px]">
            {savedScripts.length > 0 ? (
              savedScripts.map((script) => (
                <div key={script.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl hover:border-slate-700 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{script.title}</h4>
                    <button 
                      onClick={() => deleteScript(script.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {script.estimatedMinutes}m read
                    </span>
                    <span>•</span>
                    <span>{script.wordCount} words</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] text-slate-600">{formatDate(script.timestamp)}</span>
                    <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">Open Editor</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-700 h-full">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                 <span className="text-xs">No drafts yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Optimized Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Optimized</span>
            <span className="text-[10px] bg-slate-800 px-2 rounded-full text-slate-400">0</span>
          </div>
          <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-700 min-h-[150px]">
             <span className="text-xs">No items ready for upload</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeasManagerView;
