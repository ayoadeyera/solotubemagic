
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

const VoiceAssistantView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  // Helper: Manual base64 decoding following coding guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Manual base64 encoding following coding guidelines
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Robust PCM decoding for Live API audio stream (24kHz raw data)
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      // Call close() to release resources and terminate connection properly
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsActive(false);
  }, []);

  const startSession = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Always initialize with fresh GoogleGenAI instance for the latest API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };

              // Solely rely on sessionPromise resolves to send realtime input
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContextRef.current!);
              
              const source = outputAudioContextRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current!.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, { role: 'model', text }]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev, { role: 'user', text }]);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection error. Try again.");
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are an expert YouTube creative strategist. Help the user brainstorm viral video hooks, titles, and script structures in a conversational, high-energy way. Keep your responses punchy and focused on retention.',
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError("Microphone access denied or session failed.");
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-[0_0_50px_rgba(79,70,229,0.5)] scale-110' : 'bg-slate-800'}`}>
          {isActive ? (
             <div className="flex gap-1 items-center">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ height: `${Math.random() * 30 + 10}px`, animationDelay: `${i * 0.1}s` }}></div>
                ))}
             </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          )}
        </div>
        
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2">{isActive ? 'Session Live' : 'Studio Assistant'}</h2>
          <p className="text-slate-400 text-sm">
            {isActive 
              ? 'Brainstorming with Gemini... Speak naturally about your content ideas.' 
              : 'Launch a voice-first brainstorming session to craft your next viral hit. No typing needed.'}
          </p>
        </div>

        {error && <p className="text-red-400 text-xs font-bold bg-red-500/10 px-4 py-2 rounded-xl">{error}</p>}

        <button
          onClick={isActive ? stopSession : startSession}
          className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${
            isActive 
              ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
          }`}
        >
          {isActive ? 'End Brainstorm' : 'Start Brainstorming'}
        </button>
      </div>

      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 overflow-hidden flex flex-col">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Live Session Log</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 px-2">
          {transcription.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-20 italic text-sm">
              Your conversation will appear here...
            </div>
          ) : (
            transcription.map((t, i) => (
              <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${t.role === 'user' ? 'bg-indigo-600/20 text-indigo-300 rounded-tr-none' : 'bg-slate-800 text-slate-300 rounded-tl-none'}`}>
                  {t.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantView;
