
import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { KeywordResult } from '../types';

const KeywordResearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);

  const handleResearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const gemini = new GeminiService();
      const res = await gemini.researchKeywords(query);
      setResults(res);
    } catch (error) {
      console.error(error);
      alert('Research failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">High-Impact Research</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter seed keyword..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            onClick={handleResearch}
            disabled={loading}
            className="bg-indigo-600 px-8 rounded-2xl font-bold hover:bg-indigo-500 disabled:bg-slate-800"
          >
            Analyze
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Keyword</th>
              <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Avg Search Vol</th>
              <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Competition</th>
              <th className="px-6 py-4 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Opportunity Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">Performing deep web analysis...</td></tr>
            ) : results.length > 0 ? (
              results.map((res, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-400">
                    <div className="flex flex-col gap-2">
                      <span>{res.keyword}</span>
                      {res.sources && res.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {res.sources.map((src, idx) => (
                            <a 
                              key={idx} 
                              href={src.uri} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[8px] bg-slate-800/80 text-slate-500 px-1.5 py-0.5 rounded hover:text-indigo-400 border border-slate-700 transition-colors"
                              title={src.title}
                            >
                              Source {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{res.volume}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      res.competition === 'Low' ? 'bg-green-500/10 text-green-400' :
                      res.competition === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>{res.competition}</span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                       <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                         <div className="bg-indigo-600 h-full" style={{width: `${res.score}%`}}></div>
                       </div>
                       <span className="font-bold text-slate-200">{res.score}</span>
                     </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-600 italic">No research data available. Start by typing a keyword above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeywordResearchView;
