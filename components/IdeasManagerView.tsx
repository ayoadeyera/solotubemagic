
import React, { useEffect, useState, useMemo } from 'react';
import { ScriptVersion } from '../types.ts';

const CATEGORIES = ['Script', 'Idea', 'Research', 'Niche'] as const;

const IdeasManagerView: React.FC = () => {
  const [savedItems, setSavedItems] = useState<ScriptVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('tubemagic_saved_scripts');
    if (raw) {
      const parsed: ScriptVersion[] = JSON.parse(raw);
      // Migrate old data if missing category/followUp
      const migrated = parsed.map(item => ({
        ...item,
        category: item.category || 'Script',
        followUp: item.followUp || false,
        notes: item.notes || ''
      }));
      setSavedItems(migrated);
    }
  }, []);

  const saveToStorage = (items: ScriptVersion[]) => {
    setSavedItems(items);
    localStorage.setItem('tubemagic_saved_scripts', JSON.stringify(items));
  };

  const deleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      saveToStorage(savedItems.filter(s => s.id !== id));
    }
  };

  const toggleFollowUp = (id: string) => {
    saveToStorage(savedItems.map(s => s.id === id ? { ...s, followUp: !s.followUp } : s));
  };

  const updateItem = (id: string, updates: Partial<ScriptVersion>) => {
    saveToStorage(savedItems.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const filteredItems = useMemo(() => {
    return savedItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [savedItems, searchTerm, selectedCategory]);

  const stats = useMemo(() => ({
    total: savedItems.length,
    priority: savedItems.filter(s => s.followUp).length,
    wordCount: savedItems.reduce((acc, s) => acc + (s.wordCount || 0), 0)
  }), [savedItems]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(timestamp));
  };

  const getCategoryColor = (cat?: string) => {
    switch(cat) {
      case 'Script': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Idea': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Research': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Niche': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Content Manager</h2>
          <p className="text-slate-400 mt-1">Organize and refine your AI-generated assets.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-6">
            <div className="text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Assets</span>
              <span className="text-xl font-bold text-slate-200">{stats.total}</span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Priority</span>
              <span className="text-xl font-bold text-amber-500">{stats.priority}</span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Words</span>
              <span className="text-xl font-bold text-indigo-400">{(stats.wordCount / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text"
            placeholder="Search titles, notes, or keywords..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`group bg-slate-900 border transition-all rounded-3xl flex flex-col overflow-hidden ${
                item.followUp ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="p-6 space-y-4 flex-1">
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <button 
                    onClick={() => toggleFollowUp(item.id)}
                    className={`transition-all ${item.followUp ? 'text-amber-500 scale-110' : 'text-slate-700 hover:text-slate-400'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={item.followUp ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100 leading-tight group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex gap-4 text-[10px] text-slate-500 font-bold uppercase">
                    <span>{formatDate(item.timestamp)}</span>
                    <span>•</span>
                    <span>{item.wordCount} Words</span>
                  </div>
                </div>

                {/* Notes Display/Edit */}
                {editingId === item.id ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 h-24 focus:ring-1 focus:ring-indigo-600 outline-none"
                      placeholder="Add research notes or follow-up tasks..."
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <select 
                        value={item.category}
                        onChange={(e) => updateItem(item.id, { category: e.target.value as any })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-400"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setEditingId(item.id)}
                    className="cursor-pointer group/note"
                  >
                    {item.notes ? (
                      <p className="text-xs text-slate-400 italic line-clamp-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                        "{item.notes}"
                      </p>
                    ) : (
                      <div className="text-[10px] text-slate-600 border border-dashed border-slate-800 p-3 rounded-xl hover:border-slate-500 transition-all">
                        + Add notes or reminders
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center">
                 <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                   View Script
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                 </button>
                 <button 
                   onClick={() => deleteItem(item.id)}
                   className="text-slate-600 hover:text-red-500 transition-all p-1"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 border border-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="max-w-xs">
            <h3 className="text-lg font-bold text-slate-300">No assets found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or generate some new content in the Script Writer.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeasManagerView;
