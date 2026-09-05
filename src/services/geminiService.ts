import { ChatMessage, JournalSummary, ReflectionAnalysis, JournalEntry } from "../types";
import { auth } from "../lib/firebase";
import { reconcileReflectionAnalysis, computeTrendPoints } from "../utils/reflectionAnalytics";

export interface SummarizeResponse extends JournalSummary {}

export interface ChatResponse {
  reply: string;
}

/**
 * Retrieves authorization headers with the current user's Firebase ID token.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be authenticated to use MindVault AI services.");
  }
  const token = await currentUser.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Sends conversation messages to the secure server-side Gemini API endpoint.
 * Ensures the API key is never exposed to the client bundle.
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const headers = await getAuthHeaders();
  const payload = {
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to send message to Gemini at this time.");
  }

  const data: ChatResponse = await response.json();
  return data.reply;
}

/**
 * Requests a secure server-side Gemini summarization of a journal entry.
 */
export async function summarizeJournalEntry(title: string, content: string): Promise<SummarizeResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch("/api/summarize", {
    method: "POST",
    headers,
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to summarize journal entry at this time.");
  }

  return await response.json();
}

/**
 * Requests deep longitudinal pattern analysis across the user's journal entries
 * for the Personal Reflection Dashboard.
 */
export async function analyzePersonalReflection(entries: JournalEntry[]): Promise<Omit<ReflectionAnalysis, "id" | "userId">> {
  const headers = await getAuthHeaders();
  const payload = {
    entries: entries.map((e) => ({
      id: e.id,
      userId: e.userId,
      title: e.title,
      content: e.content,
      createdAt: e.createdAt,
      mood: e.mood,
      tags: e.tags,
    })),
  };

  const response = await fetch("/api/analyze-reflection", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Unable to generate reflection analysis at this time.");
  }

  const data = await response.json();

  const rawAnalysis: ReflectionAnalysis = {
    generatedAt: data.generatedAt || Date.now(),
    timeframe: "Last 30 Days",
    weeklyReflection: data.weeklyReflection,
    recurringThemes: data.recurringThemes || [],
    reflectionTrends: computeTrendPoints(entries),
    recentPatterns: data.recentPatterns || [],
    personalizedQuestions: data.personalizedQuestions || [],
    stats: {
      totalEntries: entries.length,
      streakDays: 0,
      totalWords: 0,
      totalConversations: 0,
      topTheme: "Personal Growth",
    },
  };

  // Reconcile and strictly validate against actual entries
  const reconciled = reconcileReflectionAnalysis(rawAnalysis, entries);
  const { id: _id, userId: _userId, ...cleanReconciled } = reconciled;
  return cleanReconciled;
}

/**
 * Checks the system health & security status from the backend
 */
export async function getBackendHealth(): Promise<{
  healthy: boolean;
  geminiConfigured: boolean;
  cloudRunReady: boolean;
}> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { healthy: false, geminiConfigured: false, cloudRunReady: true };
    const data = await res.json();
    return {
      healthy: data.status === "healthy",
      geminiConfigured: !!data.geminiConfigured,
      cloudRunReady: !!data.cloudRunReady,
    };
  } catch {
    return { healthy: false, geminiConfigured: false, cloudRunReady: true };
  }
}
