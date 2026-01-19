
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChannelStyle, KeywordResult, NicheResult } from "../types.ts";

export class GeminiService {
  async generateScript(params: {
    topic: string;
    style: ChannelStyle;
    lengthWords: number;
    inspiration?: string[];
  }): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { topic, style, lengthWords, inspiration } = params;
    
    const stylePrompt = style === 'Custom' 
      ? 'professional and engaging' 
      : style === 'Luxury' 
        ? 'sophisticated, high-end, and aspirational' 
        : style === 'Travel'
          ? 'vibrant, energetic, and storytelling-focused'
          : 'calm, profound, and spiritually grounded';

    const prompt = `
      Write a high-retention YouTube script about: "${topic}".
      Channel Tone: ${stylePrompt}
      Target Length: ${lengthWords} words.
      
      Structure:
      1. Hook (0-15 seconds): Grab attention immediately.
      2. Introduction: Introduce the topic and value proposition.
      3. Main Content: Broken down into engaging segments with pacing notes.
      4. Conclusion & Call to Action: Summarize and drive engagement.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text || 'Failed to generate script.';
  }

  async generateIdeas(niche: string): Promise<any[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 10 viral YouTube video ideas for the "${niche}" niche. Include a catchy title and a brief hook for each. Return ONLY a valid JSON array.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              hook: { type: Type.STRING }
            },
            required: ['title', 'description', 'hook']
          }
        }
      }
    });
    
    try {
      return JSON.parse(response.text || '[]');
    } catch {
      return [];
    }
  }

  async researchKeywords(seed: string): Promise<KeywordResult[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform deep keyword research for "${seed}" using current search trends. Respond in a JSON format array of objects with keys: keyword, volume, competition (Low/Medium/High), score (0-100).`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    let results: any[] = [];
    const text = response.text || '';
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.warn("Could not parse keyword JSON", e);
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c: any) => c.web).filter(Boolean);

    return results.map((r: any) => ({ ...r, sources }));
  }

  async researchNiches(category: string): Promise<NicheResult[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Identify 5 high-RPM, trending YouTube niches within the "${category}" category. Return results as a JSON array.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    try {
      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      return [];
    }
  }

  async generateThumbnailPrompt(scriptSummary: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a highly descriptive prompt for a viral YouTube thumbnail based on: "${scriptSummary.substring(0, 500)}".`,
    });
    return response.text || '';
  }

  async generateThumbnail(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error('No image generated');
  }

  async generateDynamicThumbnail(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async editImage(base64Data: string, prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const data = base64Data.split(',')[1];
    const mimeType = base64Data.split(';')[0].split(':')[1];
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error('Image edit failed');
  }
}
