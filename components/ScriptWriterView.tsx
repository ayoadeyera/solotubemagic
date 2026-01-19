
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService.ts';
import { CHANNEL_PRESETS, LENGTH_OPTIONS } from '../constants.tsx';
import { ChannelStyle, ScriptVersion } from '../types.ts';

const ScriptWriterView: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<ChannelStyle>('Luxury');
  const [length, setLength] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');
  const [inspiration, setInspiration] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ScriptVersion[]>([]);
  
  const rootIdRef = useRef<string>(crypto.randomUUID());
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedContentRef = useRef<string>('');

  const refreshHistory = () => {
    const raw = localStorage.getItem('tubemagic_saved_scripts');
    if (raw) {
      const allScripts: ScriptVersion[] = JSON.parse(raw);
      const filtered = allScripts
        .filter(s => s.rootId === rootIdRef.current)
        .sort((a, b) => b.timestamp - a.timestamp);
      setHistory(filtered);
    }
  };

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const currentContent = editorRef.current?.innerHTML || '';
      if (currentContent && currentContent !== lastSavedContentRef.current && !loading) {
        performSave(true);
      }
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [loading, topic]);

  useEffect(() => {
    refreshHistory();
  }, []);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setSaveStatus('idle');
    rootIdRef.current = crypto.randomUUID();
    lastSavedContentRef.current = '';
    try {
      const gemini = new GeminiService();
      const result = await gemini.generateScript({
        topic,
        style,
        lengthWords: length,
        inspiration: inspiration.length > 0 ? inspiration : undefined
      });
      const htmlResult = result.replace(/\n/g, '<br/>');
      setScript(htmlResult);
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlResult;
      }
      setHistory([]);
    } catch (error) {
      console.error(error);
      alert('Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setScript(editorRef.current.innerHTML);
    }
  };

  const performSave = (isAuto = false) => {
    const content = editorRef.current ? editorRef.current.innerHTML : script;
    const plainText = editorRef.current ? editorRef.current.innerText : '';
    if (!content) return;
    
    if (isAuto) {
      setAutoSaveStatus('saving');
    } else {
      setSaveStatus('saving');
    }
    
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const newVersion: ScriptVersion = {
      id: crypto.randomUUID(),
      rootId: rootIdRef.current,
      title: topic.length > 40 ? topic.substring(0, 37) + '...' : topic || 'Untitled Script',
      content: content,
      timestamp: Date.now(),
      wordCount: wordCount,
      estimatedMinutes: Math.ceil(wordCount / 150),
    };

    const existingScriptsRaw = localStorage.getItem('tubemagic_saved_scripts');
    const existingScripts: ScriptVersion[] = existingScriptsRaw ? JSON.parse(existingScriptsRaw) : [];
    
    localStorage.setItem('tubemagic_saved_scripts', JSON.stringify([newVersion, ...existingScripts]));
    lastSavedContentRef.current = content;
    
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      if (isAuto) {
        setAutoSaveStatus('saved');
        setLastAutoSavedAt(timeStr);
        setTimeout(() => setAutoSaveStatus('idle'), 5000);
      } else {
        setSaveStatus('saved');
        setLastAutoSavedAt(timeStr);
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
      refreshHistory();
    }, 600);
  };

  const handleSave = () => performSave(false);

  const revertToVersion = (version: ScriptVersion) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content;
      setScript(version.content);
      lastSavedContentRef.current = version.content;
    }
    setShowHistory(false);
  };

  const addInspiration = () => {
    if (newLink) {
      setInspiration([...inspiration, newLink]);
      setNewLink('');
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setScript(editorRef.current.innerHTML);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Main Details</h2>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Video Topic / Concept</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The most expensive private islands in 2024..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none min-h-[100px]"
            />
          </div>
        </section>

        <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tone & Length</h2>
          <div className="grid grid-cols-2 gap-3">
            {CHANNEL_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setStyle(p.id as ChannelStyle)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  style === p.id ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="font-bold text-xs">{p.name}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">Script Length</label>
            <select
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none"
            >
              {LENGTH_OPTIONS.map((opt) => (
                <option key={opt.words} value={opt.words}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Inspiration (Links/Docs)</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Paste YT link or URL"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs outline-none"
            />
            <button onClick={addInspiration} className="bg-slate-800 px-4 rounded-xl text-xs font-bold hover:bg-slate-700">+</button>
          </div>
          <div className="space-y-2">
            {inspiration.map((link, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-800 p-2 rounded-lg text-[10px] truncate text-slate-400 flex justify-between">
                <span>{link}</span>
                <button onClick={() => setInspiration(inspiration.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400">×</button>
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9z"/><path d="M14.5 9.5 12 12l2.5 2.5"/><path d="M9.5 12h5"/></svg>
              Generate Original Script
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-8 flex flex-col h-full min-h-[600px] relative">
        <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
               </div>
               {(autoSaveStatus !== 'idle' || lastAutoSavedAt) && (
                 <div className="flex items-center gap-2 animate-in fade-in duration-500">
                    <div className={`w-1.5 h-1.5 rounded-full ${autoSaveStatus === 'saving' ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      {autoSaveStatus === 'saving' ? 'Auto-saving...' : `Draft Saved ${lastAutoSavedAt}`}
                    </span>
                 </div>
               )}
            </div>

            <div className="text-xs font-mono text-slate-500 tracking-widest uppercase">{loading ? 'Processing...' : 'Ready'}</div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                title="Version History"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </button>
              <button 
                onClick={handleSave}
                disabled={!script || saveStatus !== 'idle'}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  saveStatus === 'saved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-500'
                }`}
              >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Script'}
              </button>
              <button onClick={() => navigator.clipboard.writeText(editorRef.current?.innerText || '')} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-700">Copy</button>
            </div>
          </div>
          
          {!loading && script && (
            <div className="px-6 py-2 border-b border-slate-800 bg-slate-900/40 flex items-center gap-1">
              <button onClick={() => execCommand('bold')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors" title="Bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
              </button>
              <button onClick={() => execCommand('italic')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors italic" title="Italic">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
              </button>
            </div>
          )}

          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
             {loading ? (
               <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                  <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-indigo-400 font-medium animate-pulse italic">Thinking like an expert storyteller...</p>
               </div>
             ) : (
               <div 
                  ref={editorRef}
                  contentEditable={!!script}
                  onInput={handleInput}
                  className={`prose prose-invert max-w-none focus:outline-none font-serif text-lg leading-relaxed text-slate-300 min-h-full ${!script ? 'flex flex-col items-center justify-center text-slate-600' : ''}`}
                  style={{ whiteSpace: 'pre-wrap' }}
               >
                 {!script && (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                     <p className="text-sm">Enter a topic and click Generate to see the magic</p>
                   </>
                 )}
               </div>
             )}

             {showHistory && (
               <div className="absolute inset-y-0 right-0 w-72 bg-slate-900 border-l border-slate-800 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Version History</h3>
                    <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {history.length > 0 ? (
                      history.map((v, idx) => (
                        <div key={v.id} className="group bg-slate-950/50 border border-slate-800 p-3 rounded-xl hover:border-indigo-500/50 transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-slate-500">{formatRelativeTime(v.timestamp)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-3">{v.wordCount} words</p>
                          <button 
                            onClick={() => revertToVersion(v)}
                            className="w-full py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                          >
                            Revert
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 text-center py-12">No history yet.</p>
                    )}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptWriterView;
