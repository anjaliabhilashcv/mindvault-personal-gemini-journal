export interface JournalSummary {
  overview: string;
  keyThemes: string[];
  importantThoughts: string[];
  reflectionQuestions: string[];
  generatedAt: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: 'reflective' | 'energized' | 'calm' | 'anxious' | 'grateful' | 'focused' | 'overwhelmed';
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  summary?: JournalSummary;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  summary?: string;
}

export interface ThemeStat {
  theme: string;
  count: number;
  percentage: number;
  description: string;
  color?: string;
}

export interface TrendPoint {
  date: string;
  entryCount: number;
  sentimentScore: number; // 1-10
  dominantTheme: string;
}

export interface ReflectionAnalysis {
  id?: string;
  userId?: string;
  generatedAt: number;
  timeframe: string;
  weeklyReflection: string;
  recurringThemes: ThemeStat[];
  reflectionTrends: TrendPoint[];
  recentPatterns: string[];
  personalizedQuestions: string[];
  stats: {
    totalEntries: number;
    streakDays: number;
    totalWords: number;
    totalConversations: number;
    topTheme: string;
  };
}

export interface SecurityStatusInfo {
  firebaseAuth: boolean;
  firestoreIsolation: boolean;
  geminiServerSide: boolean;
  cloudRunReady: boolean;
  lastChecked: number;
}
