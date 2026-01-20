import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService.ts';
import { NicheResult } from '../types.ts';

const NicheExplorerView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NicheResult[]>([]);

  const handleDeepScan = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const gemini = new GeminiService();
      const niches = await gemini.researchNiches(query);
      setResults(niches);
    } catch (error) {
      console.error(error);
      alert("Deep scan failed.");
    } finally {
      setLoading(false);
    }
  };

  const defaultNiches: NicheResult[] = [
    { name: 'Finance & Investing', rpm: '$15 - $30', trend: '+12%', description: 'Traditional finance pivot to crypto and tax hacks.', topics: [], sources: [] },
    { name: 'AI Software Reviews', rpm: '$12 - $20', trend: '+45%', description: 'Hyper-growth category driven by B2B SaaS adoption.', topics: [], sources: [] },
    { name: 'Health & Biohacking', rpm: '$8 - $18', trend: '+15%', description: 'Wearable tech and longevity protocols.', topics: [], sources: [] },
  ];

  const displayResults = results.length > 0 ? results : (query ? [] : defaultNiches);

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl overflow-hidden relative">
         <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
         <h2 className="text-2xl font-bold mb-2">Market Intelligence</h2>
         <p className="text-slate-400 text-sm max-w-lg mb-8">Analyze High-RPM categories with real-time Google Search grounding.</p>
         
         <div className="flex gap-3 mb-10 max-w-xl">
           <input
             type="text"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Search category..."
             className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
           />
           <button
             onClick={handleDeepScan}
             disabled={loading || !query}
             className="bg-indigo-600 px-8 rounded-2xl font-bold hover:bg-indigo-500 disabled:bg-slate-800 transition-all flex items-center gap-2"
           >
             {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Deep Scan'}
           </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {displayResults.map((n, i) => (
             <div key={i} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl hover:bg-slate-800/30 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-500 flex flex-col">
               <div className="flex justify-between items-start mb-4">
                 <span className="text-sm font-bold text-indigo-400">{n.name}</span>
               </div>
               <p className="text-[11px] text-slate-500 mb-6 leading-relaxed line-clamp-2">{n.description}</p>
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                   <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Est. RPM</span>
                   <span className="text-lg font-bold text-slate-100">{n.rpm}</span>
                 </div>
                 <div>
                   <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Growth</span>
                   <span className={`text-lg font-bold ${n.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{n.trend}</span>
                 </div>
               </div>

               {n.sources && n.sources.length > 0 && (
                 <div className="mt-auto pt-4 border-t border-slate-800/50">
                    <span className="text-[8px] text-slate-600 uppercase font-black block mb-2 tracking-tighter">Verified Sources</span>
                    <div className="flex flex-wrap gap-1">
                      {n.sources.map((src, idx) => (
                        <a 
                          key={idx} 
                          href={src.uri} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 hover:text-indigo-400 transition-colors truncate max-w-[100px]"
                          title={src.title}
                        >
                          Source {idx + 1}
                        </a>
                      ))}
                    </div>
                 </div>
               )}
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default NicheExplorerView;