import React, { useState, useEffect } from "react";
import { X, Save, Sparkles, Loader2, Tag, Smile } from "lucide-react";
import { JournalEntry } from "../types";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entryData: {
    title: string;
    content: string;
    mood: JournalEntry["mood"];
    tags: string[];
  }) => Promise<void>;
  initialEntry?: JournalEntry | null;
}

const MOODS: Array<{ id: JournalEntry["mood"]; label: string; emoji: string }> = [
  { id: "reflective", label: "Reflective", emoji: "🪞" },
  { id: "calm", label: "Calm", emoji: "🌿" },
  { id: "grateful", label: "Grateful", emoji: "✨" },
  { id: "energized", label: "Energized", emoji: "⚡" },
  { id: "focused", label: "Focused", emoji: "🎯" },
  { id: "anxious", label: "Anxious", emoji: "🌊" },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "🌪️" },
];

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>("reflective");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialEntry) {
      setTitle(initialEntry.title || "");
      setContent(initialEntry.content || "");
      setMood(initialEntry.mood || "reflective");
      setTags(initialEntry.tags || []);
    } else {
      setTitle("");
      setContent("");
      setMood("reflective");
      setTags([]);
    }
    setErrorMessage(null);
  }, [initialEntry, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage("Journal content cannot be empty.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave({
        title: title.trim() || "Untitled Entry",
        content: content.trim(),
        mood,
        tags,
      });
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMessage(err?.message || "Failed to save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="entry-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div
        id="entry-modal-content"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              ✍️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialEntry ? "Edit Journal Entry" : "Write New Journal Entry"}
              </h2>
              <p className="text-xs text-slate-500">
                Encrypted and isolated in your private Firestore vault
              </p>
            </div>
          </div>
          <button
            id="entry-modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Title</label>
            <input
              id="entry-title-input"
              type="text"
              placeholder="e.g. Navigating project hurdles & finding focus"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
            />
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-violet-600" />
              <span>Current Emotional Tone</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => {
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-violet-100 border-violet-300 text-violet-900 font-semibold shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Private Journal Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="entry-content-textarea"
              rows={8}
              placeholder="Write freely. What's on your mind today? What moments stood out, what challenged you, and what are you processing?..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all resize-none leading-relaxed"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Markdown supported</span>
              <span>{content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-violet-600" />
              <span>Themes & Tags</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add a tag (e.g. career, gratitude)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs border border-violet-100 font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-violet-400 hover:text-violet-700 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="entry-modal-save-btn"
            onClick={handleSubmit}
            disabled={isSaving || !content.trim()}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm shadow-violet-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save to Vault</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
