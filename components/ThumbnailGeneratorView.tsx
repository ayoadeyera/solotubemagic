
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Removed 'readonly' modifier to fix "All declarations of 'aistudio' must have identical modifiers" error.
    aistudio: AIStudio;
  }
}

const ThumbnailGeneratorView: React.FC = () => {
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'static' | 'dynamic' | 'editing' | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Image Adjustment States
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [aiEditPrompt, setAiEditPrompt] = useState('');

  const messages = [
    "Analyzing your vision...",
    "Brewing cinematic frames...",
    "Scripting subtle movements...",
    "Applying high-retention color grading...",
    "Almost there... Adding final polish.",
  ];

  useEffect(() => {
    let interval: any;
    if (loadingType === 'dynamic') {
      let i = 0;
      setStatusMessage(messages[0]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setStatusMessage(messages[i]);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [loadingType]);

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setZoom(100);
  };

  const handleGenerateStatic = async () => {
    if (!desc) return;
    setLoading(true);
    setLoadingType('static');
    resetAdjustments();
    try {
      const gemini = new GeminiService();
      const optimizedPrompt = await gemini.generateThumbnailPrompt(desc);
      const imgUrl = await gemini.generateThumbnail(optimizedPrompt);
      setMediaUrl(imgUrl);
      setMediaType('image');
    } catch (error) {
      console.error(error);
      alert('Thumbnail generation failed.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleAiRefine = async () => {
    if (!aiEditPrompt || !mediaUrl || mediaType !== 'image') return;
    setLoading(true);
    setLoadingType('editing');
    try {
      const gemini = new GeminiService();
      const editedUrl = await gemini.editImage(mediaUrl, aiEditPrompt);
      setMediaUrl(editedUrl);
      setAiEditPrompt('');
    } catch (error) {
      console.error(error);
      alert('AI refinement failed.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleGenerateDynamic = async () => {
    if (!desc) return;
    // Check key selection using the Window augmentation
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    setLoading(true);
    setLoadingType('dynamic');
    try {
      const gemini = new GeminiService();
      const optimizedPrompt = await gemini.generateThumbnailPrompt(desc);
      const videoUrl = await gemini.generateDynamicThumbnail(optimizedPrompt);
      setMediaUrl(videoUrl);
      setMediaType('video');
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        alert("Session expired or API key issue. Please select your API key again.");
        await window.aistudio.openSelectKey();
      } else {
        alert('Dynamic generation failed. Ensure you have a paid GCP project linked.');
      }
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-4 space-y-6 overflow-y-auto pb-8 custom-scrollbar h-full">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h2 className="text-xl font-bold">Concept Engine</h2>
          <p className="text-sm text-slate-400">Describe your video's core visual hook.</p>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="A luxurious watch resting on a marble surface with dramatic golden lighting..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm h-32 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
          />
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGenerateStatic}
              disabled={loading || !desc}
              className="bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 py-3 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
            >
              Static
            </button>
            <button
              onClick={handleGenerateDynamic}
              disabled={loading || !desc}
              className="bg-indigo-600 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingType === 'dynamic' ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Dynamic'
              )}
            </button>
          </div>
        </div>

        {mediaUrl && mediaType === 'image' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 animate-in slide-in-from-left duration-300">
             <div className="flex justify-between items-center">
               <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Studio Lab</h3>
               <button onClick={resetAdjustments} className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-bold">Reset</button>
             </div>
             
             <div className="space-y-4">
               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                   <span>Brightness</span>
                   <span>{brightness}%</span>
                 </div>
                 <input type="range" min="50" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
               </div>

               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                   <span>Contrast</span>
                   <span>{contrast}%</span>
                 </div>
                 <input type="range" min="50" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
               </div>

               <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                   <span>Zoom / Crop</span>
                   <span>{zoom}%</span>
                 </div>
                 <input type="range" min="100" max="200" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
               </div>
             </div>

             <div className="pt-4 border-t border-slate-800 space-y-3">
               <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                 Generative Refine
               </div>
               <div className="relative">
                 <input
                   type="text"
                   value={aiEditPrompt}
                   onChange={(e) => setAiEditPrompt(e.target.value)}
                   placeholder="e.g. Add a red glow to the edges..."
                   className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-indigo-600 pr-10"
                   onKeyDown={(e) => e.key === 'Enter' && handleAiRefine()}
                 />
                 <button 
                   onClick={handleAiRefine}
                   disabled={!aiEditPrompt || loading}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:text-slate-700"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                 </button>
               </div>
             </div>
          </div>
        )}

        <div className="bg-indigo-600/5 border border-indigo-600/10 p-6 rounded-3xl">
           <p className="text-[10px] text-slate-500 leading-relaxed italic">
             Dynamic loops use <strong>Veo 3.1</strong>. Generative edits use <strong>Gemini 2.5</strong>. Paid project required for video features. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline">billing docs</a>.
           </p>
        </div>
      </div>

      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative flex flex-col min-h-[500px]">
        {mediaUrl ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100})`,
                }}
              >
                {mediaType === 'image' ? (
                  <img 
                    src={mediaUrl} 
                    alt="Generated Thumbnail" 
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                  />
                ) : (
                  <video src={mediaUrl} autoPlay loop muted playsInline className="max-w-full max-h-full object-contain" />
                )}
              </div>
              
              {mediaType === 'video' && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-widest">Dynamic</div>
              )}
            </div>
            
            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center z-10">
               <div className="space-y-1">
                 <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">Asset Details</span>
                 <span className="text-xs text-slate-300">{mediaType === 'image' ? '1K High Resolution PNG' : '720p Looping MP4'}</span>
               </div>
               <div className="flex gap-4">
                 <button onClick={() => setMediaUrl(null)} className="text-xs text-slate-500 hover:text-slate-300 px-3 transition-colors">Discard</button>
                 <a 
                   href={mediaUrl} 
                   download={mediaType === 'image' ? 'thumbnail.png' : 'thumbnail.mp4'} 
                   className="bg-indigo-600 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                 >
                   Download Asset
                 </a>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-12">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl rotate-12 flex items-center justify-center text-slate-600 border border-slate-700 shadow-2xl">
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-slate-300">Awaiting Creation</h3>
              <p className="text-slate-500 text-sm">Your cinematic thumbnail or dynamic loop will appear here in high definition.</p>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-20 backdrop-blur-md animate-in fade-in duration-300">
             <div className="text-center max-w-xs px-6">
                <div className="relative mb-8">
                   <div className="w-20 h-20 border-4 border-indigo-600/10 rounded-full mx-auto"></div>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h4 className="text-indigo-400 font-bold text-xl mb-3">
                  {loadingType === 'editing' ? 'Refining Details' : 'Dreaming Big'}
                </h4>
                <p className="text-slate-400 text-sm animate-pulse italic leading-relaxed">
                  {loadingType === 'dynamic' ? statusMessage : 'Crafting the perfect visual narrative...'}
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThumbnailGeneratorView;
