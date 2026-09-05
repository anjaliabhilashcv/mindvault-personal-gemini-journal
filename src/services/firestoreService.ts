import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { JournalEntry, JournalSummary, Conversation, ReflectionAnalysis } from "../types";

/**
 * Validates that userId is present before any Firestore operation.
 * Prevents unauthorized or undefined path queries.
 */
function assertUser(userId: string | undefined): asserts userId is string {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Security Violation: A valid authenticated User ID is required for Firestore operations.");
  }
}

// ----------------------------------------------------
// JOURNAL ENTRIES
// ----------------------------------------------------

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  assertUser(userId);
  try {
    const colRef = collection(db, "users", userId, "journalEntries");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId,
        title: data.title || "Untitled Entry",
        content: data.content || "",
        mood: data.mood || "reflective",
        tags: data.tags || [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        summary: data.summary || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching journal entries from Firestore:", error);
    throw error;
  }
}

/**
 * Real-time listener for user's journal entries.
 * Ensures instant UI updates without manual refreshes.
 */
export function subscribeJournalEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  assertUser(userId);
  const colRef = collection(db, "users", userId, "journalEntries");
  const q = query(colRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId,
          title: data.title || "Untitled Entry",
          content: data.content || "",
          mood: data.mood || "reflective",
          tags: data.tags || [],
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          summary: data.summary || undefined,
        };
      });
      onUpdate(entries);
    },
    (err) => {
      console.error("Firestore onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

export async function getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
  assertUser(userId);
  try {
    const docRef = doc(db, "users", userId, "journalEntries", entryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId,
      title: data.title || "Untitled Entry",
      content: data.content || "",
      mood: data.mood || "reflective",
      tags: data.tags || [],
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      summary: data.summary || undefined,
    };
  } catch (error) {
    console.error(`Error fetching entry ${entryId}:`, error);
    throw error;
  }
}

export async function createJournalEntry(
  userId: string,
  entry: {
    title: string;
    content: string;
    mood?: JournalEntry["mood"];
    tags?: string[];
    summary?: JournalSummary;
  }
): Promise<string> {
  assertUser(userId);
  const now = Date.now();
  const colRef = collection(db, "users", userId, "journalEntries");

  const cleanData: any = {
    userId,
    title: entry.title.trim() || "Untitled Entry",
    content: entry.content.trim(),
    mood: entry.mood || "reflective",
    tags: entry.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  if (entry.summary) {
    cleanData.summary = entry.summary;
  }

  const docRef = await addDoc(colRef, cleanData);
  return docRef.id;
}

export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<Pick<JournalEntry, "title" | "content" | "mood" | "tags" | "summary">>
): Promise<void> {
  assertUser(userId);
  const docRef = doc(db, "users", userId, "journalEntries", entryId);
  const cleanUpdates: any = {
    ...updates,
    updatedAt: Date.now(),
  };

  // Strip undefined values
  Object.keys(cleanUpdates).forEach((key) => {
    if (cleanUpdates[key] === undefined) {
      delete cleanUpdates[key];
    }
  });

  await updateDoc(docRef, cleanUpdates);
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  assertUser(userId);
  const docRef = doc(db, "users", userId, "journalEntries", entryId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------
// CONVERSATIONS
// ----------------------------------------------------

export async function getConversations(userId: string): Promise<Conversation[]> {
  assertUser(userId);
  try {
    const colRef = collection(db, "users", userId, "conversations");
    const q = query(colRef, orderBy("updatedAt", "desc"), limit(25));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId,
        title: data.title || "Chat with Gemini",
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        messages: Array.isArray(data.messages) ? data.messages : [],
        summary: data.summary || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export async function saveConversation(userId: string, conversation: Conversation): Promise<void> {
  assertUser(userId);
  const docRef = doc(db, "users", userId, "conversations", conversation.id);
  const cleanData: any = {
    userId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: Date.now(),
    messages: conversation.messages,
  };
  if (conversation.summary) {
    cleanData.summary = conversation.summary;
  }
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  assertUser(userId);
  const docRef = doc(db, "users", userId, "conversations", conversationId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------
// REFLECTION ANALYSIS (Original Phase 3 Feature)
// ----------------------------------------------------

export async function saveReflectionAnalysis(
  userId: string,
  analysis: Omit<ReflectionAnalysis, "id" | "userId">
): Promise<string> {
  assertUser(userId);
  const colRef = collection(db, "users", userId, "reflections");
  const docRef = await addDoc(colRef, {
    ...analysis,
    userId,
    generatedAt: Date.now(),
  });
  return docRef.id;
}

export async function getLatestReflectionAnalysis(userId: string): Promise<ReflectionAnalysis | null> {
  assertUser(userId);
  try {
    const colRef = collection(db, "users", userId, "reflections");
    const q = query(colRef, orderBy("generatedAt", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId,
      generatedAt: data.generatedAt || Date.now(),
      timeframe: data.timeframe || "Recent Period",
      weeklyReflection: data.weeklyReflection || "",
      recurringThemes: data.recurringThemes || [],
      reflectionTrends: data.reflectionTrends || [],
      recentPatterns: data.recentPatterns || [],
      personalizedQuestions: data.personalizedQuestions || [],
      stats: data.stats || {
        totalEntries: 0,
        streakDays: 0,
        totalWords: 0,
        totalConversations: 0,
        topTheme: "N/A",
      },
    };
  } catch (error) {
    console.error("Error retrieving latest reflection analysis:", error);
    return null;
  }
}
