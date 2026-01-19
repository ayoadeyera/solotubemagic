
export enum ToolType {
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  IDEA_GENERATOR = 'IDEA_GENERATOR',
  KEYWORD_RESEARCH = 'KEYWORD_RESEARCH',
  NICHE_EXPLORER = 'NICHE_EXPLORER',
  THUMBNAIL_GEN = 'THUMBNAIL_GEN',
  OPTIMIZER = 'OPTIMIZER',
  CHANNEL_TOOLS = 'CHANNEL_TOOLS',
  IDEAS_MANAGER = 'IDEAS_MANAGER',
  ASSISTANT = 'ASSISTANT'
}

export interface ScriptVersion {
  id: string;
  rootId: string;
  title: string;
  content: string;
  timestamp: number;
  wordCount: number;
  estimatedMinutes: number;
  category?: 'Script' | 'Idea' | 'Research' | 'Niche';
  notes?: string;
  followUp?: boolean;
}

export interface KeywordResult {
  keyword: string;
  volume: string;
  competition: 'Low' | 'Medium' | 'High';
  score: number;
  sources?: { uri: string; title: string }[];
}

export interface NicheResult {
  name: string;
  rpm: string;
  trend: string;
  description: string;
  topics: string[];
}

export type ChannelStyle = 'Luxury' | 'Travel' | 'Self-Help' | 'Custom';
