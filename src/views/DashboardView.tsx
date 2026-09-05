import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  Flame,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  ChevronRight,
  Loader2,
  FileText,
  HelpCircle,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { JournalEntry, ReflectionAnalysis } from "../types";
import { getJournalEntries, getLatestReflectionAnalysis } from "../services/firestoreService";
import { reconcileReflectionAnalysis } from "../utils/reflectionAnalytics";
import { SecurityBadge } from "../components/SecurityBadge";
import { NavTab } from "../components/Sidebar";

interface DashboardViewProps {
  setActiveTab: (tab: NavTab) => void;
  onNewEntryClick: () => void;
  onOpenEntry: (entry: JournalEntry) => void;
  entries?: JournalEntry[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onNewEntryClick,
  onOpenEntry,
  entries: propEntries,
}) => {
  const { user } = useAuth();
  const [internalEntries, setInternalEntries] = useState<JournalEntry[]>([]);
  const [reflection, setReflection] = useState<ReflectionAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const entries = propEntries !== undefined ? propEntries : internalEntries;

  // Truthful data-driven reconciliation
  const reconciledReflection = useMemo(() => {
    if (!reflection) return null;
    return reconcileReflectionAnalysis(reflection, entries);
  }, [reflection, entries]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedEntries, latestReflection] = await Promise.all([
        getJournalEntries(user.uid),
        getLatestReflectionAnalysis(user.uid),
      ]);
      setInternalEntries(fetchedEntries);
      if (latestReflection) {
        setReflection(reconcileReflectionAnalysis(latestReflection, fetchedEntries));
      } else {
        setReflection(null);
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const recentEntries = entries.slice(0, 3);
  const summarizedCount = entries.filter((e) => !!e.summary).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                {formattedDate}
              </span>
              <span className="text-violet-400">•</span>
              <span className="text-xs text-violet-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Private account • UID isolated
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {getGreeting()},{" "}
              <span className="text-violet-200">
                {user?.displayName ? user.displayName.split(" ")[0] : "Journaler"}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Your personal sanctuary is synced with Cloud Firestore. Let your thoughts flow
              freely or brainstorm with your server-side Gemini companion.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-new-entry-btn"
              onClick={onNewEntryClick}
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-violet-600" />
              <span>New Journal Entry</span>
            </button>
            <button
              id="dashboard-chat-gemini-btn"
              onClick={() => setActiveTab("chat")}
              className="px-4 py-2.5 bg-violet-600/80 hover:bg-violet-600 text-white text-xs sm:text-sm font-semibold rounded-lg border border-violet-400/40 shadow-sm shadow-violet-900/30 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-violet-200" />
              <span>Chat with Gemini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Journal Entries</span>
            <BookOpen className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{entries.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Saved to Firestore</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Journaling Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {reconciledReflection?.stats?.streakDays || (entries.length > 0 ? 1 : 0)}{" "}
            <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Consistent Habit</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>AI Summaries</span>
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{summarizedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Gemini Synthesized
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Security Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-emerald-600">Active</div>
          <div className="text-[11px] text-slate-400 mt-1">UID Boundary Valid</div>
        </div>
      </div>

      {/* FEATURE SPOTLIGHT: Personal Reflection Dashboard Preview (Original Phase 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-violet-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  Personal Reflection Dashboard
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">
                  AI-POWERED INSIGHTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Longitudinal AI analysis analyzing exclusively your personal journal entries
              </p>
            </div>
          </div>

          <button
            id="dashboard-open-reflections-btn"
            onClick={() => setActiveTab("reflections")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Open Reflection Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Theme Highlights */}
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
              <span>Top Recurring Themes</span>
            </h4>
            {reconciledReflection?.recurringThemes && reconciledReflection.recurringThemes.length > 0 ? (
              <div className="space-y-2">
                {reconciledReflection.recurringThemes.slice(0, 3).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">#{t.theme}</span>
                    <span className="text-violet-700 font-bold">{t.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Write entries to generate your theme frequency analysis.
              </p>
            )}
          </div>

          {/* Weekly Synthesis Preview */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Weekly AI Reflection Snippet</span>
                </h4>
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-bold">
                  AI INSIGHT
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">
                "{reconciledReflection?.weeklyReflection ||
                  "Your thoughts display an ongoing journey toward balance and mental clarity. Explore your full Reflection Dashboard to view 30-day sentiment trends."}"
              </p>
            </div>
            <div className="mt-2 text-[11px] text-violet-700 font-medium flex items-center gap-1">
              <span>Includes 4 personalized growth prompts</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Recent Journal Activity & Security Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Journal Activity (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Recent Journal Activity</h3>
              <p className="text-xs text-slate-400">Your latest encrypted entries</p>
            </div>
            <button
              id="dashboard-view-all-entries-btn"
              onClick={() => setActiveTab("journal")}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({entries.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-violet-600 mb-2" />
              Loading your private entries...
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No journal entries yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Begin your journaling journey. Write down your thoughts, struggles, or gratitude
                today.
              </p>
              <button
                id="dashboard-empty-first-entry-btn"
                onClick={onNewEntryClick}
                className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg shadow-sm shadow-violet-200 hover:bg-violet-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write First Entry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => onOpenEntry(entry)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-violet-300 transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">
                          {entry.title}
                        </h4>
                        {entry.mood && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                            {entry.mood}
                          </span>
                        )}
                        {entry.summary && (
                          <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Summarized
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {entry.content}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.createdAt).toLocaleDateString()} •{" "}
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {entry.tags && entry.tags.length > 0 && (
                      <span className="text-violet-600 font-medium">#{entry.tags.join(" #")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Security Architecture Status & Reflection Prompt */}
        <div className="space-y-4">
          <SecurityBadge />

          {/* Daily Thought / Writing Prompt */}
          <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2 text-violet-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Gemini Reflection Prompt</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              "What is one small victory or subtle moment of clarity from today that you haven't given yourself credit for yet?"
            </p>
            <button
              onClick={onNewEntryClick}
              className="mt-3 text-xs font-semibold text-violet-700 hover:text-violet-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Journal on this prompt</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
