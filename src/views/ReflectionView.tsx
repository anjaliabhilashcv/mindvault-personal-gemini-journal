import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  BarChart2,
  Calendar,
  Compass,
  HelpCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Flame,
  FileText,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { JournalEntry, ReflectionAnalysis } from "../types";
import {
  getJournalEntries,
  getLatestReflectionAnalysis,
  saveReflectionAnalysis,
} from "../services/firestoreService";
import { analyzePersonalReflection } from "../services/geminiService";
import { reconcileReflectionAnalysis } from "../utils/reflectionAnalytics";

interface ReflectionViewProps {
  onNewEntryClick: () => void;
  onOpenEntry: (entryId: string) => void;
}

export const ReflectionView: React.FC<ReflectionViewProps> = ({
  onNewEntryClick,
  onOpenEntry,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [analysis, setAnalysis] = useState<ReflectionAnalysis | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Strictly reconcile analysis against the user's authentic Firestore journal entries
  const activeAnalysis = useMemo(() => {
    if (!analysis) return null;
    return reconcileReflectionAnalysis(analysis, entries);
  }, [analysis, entries]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoadingEntries(true);
    setErrorMessage(null);
    try {
      const [fetchedEntries, latestSavedAnalysis] = await Promise.all([
        getJournalEntries(user.uid),
        getLatestReflectionAnalysis(user.uid),
      ]);
      setEntries(fetchedEntries);
      if (latestSavedAnalysis) {
        const reconciled = reconcileReflectionAnalysis(latestSavedAnalysis, fetchedEntries);
        setAnalysis(reconciled);
        // If stored document had inaccurate counts, update in Firestore
        if (
          latestSavedAnalysis.stats?.totalEntries !== fetchedEntries.length ||
          latestSavedAnalysis.recurringThemes?.some((t) => t.count > fetchedEntries.length)
        ) {
          saveReflectionAnalysis(user.uid, reconciled).catch(() => {});
        }
      } else if (fetchedEntries.length > 0) {
        // Auto-run initial analysis if none saved yet
        runAnalysis(fetchedEntries);
      }
    } catch (err: any) {
      console.error("Error loading reflection data:", err);
      setErrorMessage("Failed to load reflection insights from Firestore.");
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const runAnalysis = async (currentEntries = entries) => {
    if (!user) return;
    if (currentEntries.length === 0) {
      setErrorMessage("Write at least one journal entry to generate your Reflection Dashboard.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const generated = await analyzePersonalReflection(currentEntries);
      const reconciled = reconcileReflectionAnalysis(generated as ReflectionAnalysis, currentEntries);
      const savedId = await saveReflectionAnalysis(user.uid, reconciled);
      setAnalysis({
        ...reconciled,
        id: savedId,
        userId: user.uid,
      });
    } catch (err: any) {
      console.error("Reflection analysis error:", err);
      setErrorMessage(
        err?.message || "Failed to generate reflection analysis with Gemini. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoadingEntries) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600 mb-3" />
        <p className="text-sm font-medium">Gathering your private reflection vault...</p>
      </div>
    );
  }

  // Empty State
  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Personal Reflection Dashboard
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
          The Reflection Dashboard synthesizes your personal growth, recurring thoughts, and
          thematic patterns across your journal entries.
        </p>
        <div className="mt-6">
          <button
            id="reflection-empty-new-entry-btn"
            onClick={onNewEntryClick}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-violet-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Write Your First Journal Entry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-violet-100 text-violet-700 rounded-full tracking-wider">
              AI-POWERED INSIGHTS
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              Isolated to {user?.displayName || "Your Account"}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">
            Personal Reflection Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Synthesized exclusively from your {entries.length} private journal {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-reflection-btn"
            onClick={() => runAnalysis()}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg border border-violet-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-violet-600" : ""}`} />
            <span>{isAnalyzing ? "Analyzing with Gemini..." : "Refresh Insights"}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Key Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Journal Entries</span>
            <FileText className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{entries.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">100% Firestore Synced</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Active Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeAnalysis?.stats.streakDays || (entries.length > 0 ? 1 : 0)}{" "}
            <span className="text-sm font-normal text-slate-400">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Reflective Habit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Words Written</span>
            <BookOpen className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {entries.reduce((acc, curr) => acc + (curr.content ? curr.content.split(/\s+/).filter(Boolean).length : 0), 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Self-Exploration Volume</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Top Recurring Theme</span>
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-lg font-bold text-violet-900 truncate">
            {activeAnalysis?.recurringThemes[0]?.theme || "Personal Growth"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Primary Core Focus</div>
        </div>
      </div>

      {/* Section 1: Weekly AI Reflection (Gemini Synthesis) */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/10 rounded-lg text-violet-300 backdrop-blur-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
            Gemini Weekly Reflection Synthesis
          </span>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-slate-200 font-medium max-w-3xl">
          {activeAnalysis?.weeklyReflection ||
            "Your recent journal entries illustrate an intentional focus on personal clarity, emotional balance, and purposeful daily progress."}
        </p>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-violet-300">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last analyzed: {activeAnalysis?.generatedAt ? new Date(activeAnalysis.generatedAt).toLocaleDateString() : "Today"}
          </span>
          <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-200">
            Computed by Gemini 2.5 Flash
          </span>
        </div>
      </div>

      {/* Section 2 & 3: Themes and Reflection Trend Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Recurring Themes Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-50 text-violet-700 rounded-lg">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">1. Recurring Themes</h3>
              </div>
              <span className="text-xs text-slate-400">Frequency Analysis</span>
            </div>

            <div className="space-y-3.5">
              {activeAnalysis?.recurringThemes && activeAnalysis.recurringThemes.length > 0 ? (
                activeAnalysis.recurringThemes.map((themeItem, index) => (
                  <div key={themeItem.theme || index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                        {themeItem.theme}
                      </span>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>
                          {themeItem.count} {themeItem.count === 1 ? "entry" : "entries"}
                        </span>
                        <span className="font-bold text-violet-700">{themeItem.percentage}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-violet-700 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, themeItem.percentage))}%` }}
                      />
                    </div>
                    {themeItem.description && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{themeItem.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-6 text-center">
                  Theme analysis will display here after generating reflection insights.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Detected across your saved journal entries in Cloud Firestore.
          </div>
        </div>

        {/* 2. Reflection Trend Timeline Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-50 text-violet-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">2. Reflection Trends</h3>
              </div>
              <span className="text-xs text-violet-700 font-medium">30-Day Activity</span>
            </div>

            {/* Visual SVG Timeline Chart */}
            <div className="py-2">
              <div className="h-44 w-full flex items-end justify-between gap-2 px-2 pb-6 border-b border-slate-100">
                {activeAnalysis?.reflectionTrends && activeAnalysis.reflectionTrends.length >= 2 ? (
                  activeAnalysis.reflectionTrends.map((point, idx) => {
                    const heightPercent = Math.max(15, (point.sentimentScore / 10) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-10">
                          {point.date}: {point.entryCount} entries ({point.dominantTheme})
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full max-w-[28px] bg-violet-200 hover:bg-violet-600 rounded-t-md transition-all cursor-pointer"
                          style={{ height: `${heightPercent}%` }}
                        />
                        {/* Date label */}
                        <span className="text-[10px] text-slate-400 rotate-0 truncate max-w-[36px]">
                          {point.date.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                    <TrendingUp className="w-6 h-6 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      Keep journaling to unlock your reflection trends.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Record entries across multiple days to visualize your reflective activity and sentiment over time.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                <span>Reflection Depth & Energy</span>
              </span>
              <span>Updated in Realtime</span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Helps visualize journaling frequency and consistency over time.
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Recent Patterns & Personalized Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Recent Patterns */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <div className="p-1.5 bg-violet-50 text-violet-700 rounded-lg">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">3. Recent Patterns</h3>
          </div>

          <div className="space-y-2.5">
            {activeAnalysis?.recentPatterns && activeAnalysis.recentPatterns.length > 0 ? (
              activeAnalysis.recentPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{pattern}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">
                Patterns appear as entries are analyzed.
              </div>
            )}
          </div>
        </div>

        {/* 4. Personalized Reflection Questions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <div className="p-1.5 bg-violet-50 text-violet-700 rounded-lg">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">4. Personalized Growth Questions</h3>
          </div>

          <div className="space-y-2.5">
            {activeAnalysis?.personalizedQuestions && activeAnalysis.personalizedQuestions.length > 0 ? (
              activeAnalysis.personalizedQuestions.map((question, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-violet-50/70 rounded-xl border border-violet-100 text-xs text-slate-800 flex items-start gap-2.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{question}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">
                Questions will be personalized based on your themes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medical / Ethical Disclaimer Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-500">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">MindVault Ethical Transparency: </span>
          The Personal Reflection Dashboard and Gemini-generated reflections are intended solely for personal mindfulness, self-reflection, and creative thought organization. They are NOT medically accurate, psychiatric, or clinical diagnostic evaluations.
        </div>
      </div>
    </div>
  );
};
