import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Sparkles,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  Tag,
  Smile,
  BookOpen,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { JournalEntry, JournalSummary } from "../types";
import {
  getJournalEntries,
  subscribeJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
} from "../services/firestoreService";
import { summarizeJournalEntry } from "../services/geminiService";
import { ConfirmModal } from "../components/ConfirmModal";

interface JournalViewProps {
  onNewEntryClick: () => void;
  onEditEntryClick: (entry: JournalEntry) => void;
  selectedEntryToOpen?: JournalEntry | null;
}

export const JournalView: React.FC<JournalViewProps> = ({
  onNewEntryClick,
  onEditEntryClick,
  selectedEntryToOpen,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>("all");
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  // Summarize state
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  // Delete state
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy notification
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeJournalEntries(
      user.uid,
      (data) => {
        setEntries(data);
        setLoading(false);
        setActiveEntry((prev) => {
          if (!prev) return data.length > 0 ? data[0] : null;
          const matched = data.find((e) => e.id === prev.id);
          return matched || (data.length > 0 ? data[0] : null);
        });
      },
      (err) => {
        console.error("Failed to subscribe to entries in JournalView:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedEntryToOpen) {
      setActiveEntry(selectedEntryToOpen);
    }
  }, [selectedEntryToOpen]);

  // Summarize with Gemini
  const handleSummarize = async (entry: JournalEntry) => {
    if (!user) return;
    setSummarizingId(entry.id);
    setSummarizeError(null);

    try {
      const summaryResult: JournalSummary = await summarizeJournalEntry(
        entry.title,
        entry.content
      );

      // Save immediately to Firestore
      await updateJournalEntry(user.uid, entry.id, {
        summary: summaryResult,
      });

      // Update local state
      const updatedEntry = { ...entry, summary: summaryResult };
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? updatedEntry : e))
      );
      if (activeEntry?.id === entry.id) {
        setActiveEntry(updatedEntry);
      }
    } catch (err: any) {
      console.error("Error summarizing entry:", err);
      setSummarizeError(
        err?.message || "Failed to summarize entry with Gemini. Your entry is safe; please try again."
      );
    } finally {
      setSummarizingId(null);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!user || !entryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteJournalEntry(user.uid, entryToDelete.id);
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      if (activeEntry?.id === entryToDelete.id) {
        const remaining = entries.filter((e) => e.id !== entryToDelete.id);
        setActiveEntry(remaining.length > 0 ? remaining[0] : null);
      }
      setEntryToDelete(null);
    } catch (err) {
      console.error("Error deleting entry:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy entry content
  const handleCopy = (entry: JournalEntry) => {
    navigator.clipboard.writeText(`${entry.title}\n\n${entry.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter & search
  const filteredEntries = entries.filter((e) => {
    const matchesQuery =
      searchQuery.trim() === "" ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.tags && e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesMood =
      selectedMoodFilter === "all" || e.mood === selectedMoodFilter;

    return matchesQuery && matchesMood;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="journal-search-input"
            type="text"
            placeholder="Search journal by title, keyword, or #tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
          />
        </div>

        {/* Mood filter & New button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="journal-mood-filter"
              value={selectedMoodFilter}
              onChange={(e) => setSelectedMoodFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Moods</option>
              <option value="reflective">Reflective</option>
              <option value="calm">Calm</option>
              <option value="grateful">Grateful</option>
              <option value="energized">Energized</option>
              <option value="focused">Focused</option>
              <option value="anxious">Anxious</option>
              <option value="overwhelmed">Overwhelmed</option>
            </select>
          </div>

          <button
            id="journal-new-entry-action-btn"
            onClick={onNewEntryClick}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {summarizeError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{summarizeError}</span>
          </div>
          <button
            onClick={() => setSummarizeError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Content Area: Side-by-side List and Reader/Editor */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-600 mb-2" />
          <p className="text-xs font-medium">Decrypting your private entries...</p>
        </div>
      ) : entries.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Your journal is waiting</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Record your daily reflections, breakthroughs, and challenges. You can ask Gemini to
            summarize entries and detect recurring themes automatically.
          </p>
          <button
            id="journal-empty-write-btn"
            onClick={onNewEntryClick}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-violet-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write First Entry</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Entries Column (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-slate-500 px-1 flex items-center justify-between">
              <span>Entries ({filteredEntries.length})</span>
              <span>Sorted by Recent</span>
            </div>

            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredEntries.map((entry) => {
                const isSelected = activeEntry?.id === entry.id;
                return (
                  <div
                    key={entry.id}
                    id={`journal-item-${entry.id}`}
                    onClick={() => setActiveEntry(entry)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-violet-50/70 border-violet-300 shadow-sm ring-1 ring-violet-400"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? "text-violet-950" : "text-slate-900"
                        }`}
                      >
                        {entry.title}
                      </h4>
                      {entry.mood && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      {entry.summary && (
                        <span className="text-violet-700 font-semibold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Summarized
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredEntries.length === 0 && (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-100 text-xs text-slate-400">
                  No entries match your search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Active Entry Detail / Reader Column (8 cols on lg) */}
          <div className="lg:col-span-8">
            {activeEntry ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {activeEntry.mood && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-800 rounded-md">
                          {activeEntry.mood}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(activeEntry.createdAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {activeEntry.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id="entry-summarize-btn"
                      onClick={() => handleSummarize(activeEntry)}
                      disabled={summarizingId === activeEntry.id}
                      className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg border border-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Summarize with Gemini AI"
                    >
                      {summarizingId === activeEntry.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                      )}
                      <span>
                        {summarizingId === activeEntry.id
                          ? "Summarizing..."
                          : activeEntry.summary
                          ? "Re-summarize AI"
                          : "Summarize with Gemini"}
                      </span>
                    </button>

                    <button
                      id="entry-copy-btn"
                      onClick={() => handleCopy(activeEntry)}
                      title="Copy content"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      id="entry-edit-btn"
                      onClick={() => onEditEntryClick(activeEntry)}
                      title="Edit entry"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      id="entry-delete-btn"
                      onClick={() => setEntryToDelete(activeEntry)}
                      title="Delete entry"
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* AI Summary Card (If generated) */}
                {activeEntry.summary && (
                  <div className="p-5 rounded-2xl bg-violet-50/50 border border-violet-200 shadow-sm space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-violet-600 text-white rounded-lg shadow-sm">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-violet-900">
                          Gemini Journal Synthesis
                        </h4>
                      </div>
                      <span className="text-[10px] text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full font-semibold">
                        Stored in Firestore
                      </span>
                    </div>

                    {/* Overview */}
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-3.5 rounded-xl border border-violet-100">
                      "{activeEntry.summary.overview}"
                    </p>

                    {/* Themes */}
                    {activeEntry.summary.keyThemes && activeEntry.summary.keyThemes.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-violet-600" />
                          <span>Detected Themes:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeEntry.summary.keyThemes.map((theme, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200"
                            >
                              #{theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Important Thoughts & Questions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {activeEntry.summary.importantThoughts &&
                        activeEntry.summary.importantThoughts.length > 0 && (
                          <div className="p-3.5 bg-white rounded-xl border border-violet-100 text-xs text-slate-700 space-y-1.5">
                            <span className="font-bold text-violet-900 block mb-1">
                              Notable Thoughts:
                            </span>
                            {activeEntry.summary.importantThoughts.map((thought, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-violet-600 font-bold">•</span>
                                <span>{thought}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      {activeEntry.summary.reflectionQuestions &&
                        activeEntry.summary.reflectionQuestions.length > 0 && (
                          <div className="p-3.5 bg-white rounded-xl border border-violet-100 text-xs text-slate-700 space-y-1.5">
                            <span className="font-bold text-violet-900 block mb-1 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3 text-violet-600" />
                              <span>Reflection Questions:</span>
                            </span>
                            {activeEntry.summary.reflectionQuestions.map((q, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-violet-600 font-bold">?</span>
                                <span className="italic">{q}</span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Entry Content Body */}
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {activeEntry.content}
                </div>

                {/* Tags footer */}
                {activeEntry.tags && activeEntry.tags.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {activeEntry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                Select an entry to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!entryToDelete}
        title="Delete Journal Entry"
        message={`Are you sure you want to permanently delete "${entryToDelete?.title}"? This action removes the document from Cloud Firestore and cannot be undone.`}
        confirmLabel="Delete Entry"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};
