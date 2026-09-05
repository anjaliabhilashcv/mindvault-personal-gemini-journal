import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Loader2,
  Clock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ChatMessage, Conversation, JournalEntry } from "../types";
import {
  getConversations,
  saveConversation,
  deleteConversation,
  createJournalEntry,
} from "../services/firestoreService";
import { sendChatMessage } from "../services/geminiService";

interface ChatViewProps {
  onSavedAsJournalEntry: (entryId: string) => void;
}

const STARTER_PROMPTS = [
  "Help me reflect on a stressful decision I made today.",
  "Ask me 3 thoughtful questions to help me unpack my career goals.",
  "I want to practice an evening gratitude journaling session.",
  "Brainstorm ways to overcome creative block and regain focus.",
];

export const ChatView: React.FC<ChatViewProps> = ({ onSavedAsJournalEntry }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const convs = await getConversations(user.uid);
      setConversations(convs);
      if (convs.length > 0) {
        selectConversation(convs[0]);
      } else {
        startNewConversation();
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  };

  const startNewConversation = () => {
    const newConv: Conversation = {
      id: "conv_" + Date.now(),
      userId: user?.uid || "",
      title: "New Reflection Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "m_welcome",
          role: "model",
          content: `Hello ${user?.displayName?.split(" ")[0] || "there"}. I am your MindVault reflection companion. What would you like to explore or brainstorm today?`,
          timestamp: Date.now(),
        },
      ],
    };
    setCurrentConversation(newConv);
    setMessages(newConv.messages);
    setErrorMessage(null);
  };

  const selectConversation = (conv: Conversation) => {
    setCurrentConversation(conv);
    setMessages(conv.messages || []);
    setErrorMessage(null);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || !user || isSending) return;

    const userMessage: ChatMessage = {
      id: "m_" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      // Call server-side Gemini API
      const reply = await sendChatMessage(updatedMessages);

      const modelMessage: ChatMessage = {
        id: "m_" + (Date.now() + 1),
        role: "model",
        content: reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setMessages(finalMessages);

      // Derive title if it was first message
      let title = currentConversation?.title || "Reflection Discussion";
      if (
        currentConversation?.title === "New Reflection Chat" &&
        updatedMessages.length <= 3
      ) {
        title = textToSend.slice(0, 36) + (textToSend.length > 36 ? "..." : "");
      }

      const updatedConv: Conversation = {
        id: currentConversation?.id || "conv_" + Date.now(),
        userId: user.uid,
        title,
        createdAt: currentConversation?.createdAt || Date.now(),
        updatedAt: Date.now(),
        messages: finalMessages,
      };

      setCurrentConversation(updatedConv);

      // Persist conversation to Firestore
      await saveConversation(user.uid, updatedConv);

      // Update conversations list
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== updatedConv.id);
        return [updatedConv, ...filtered];
      });
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMessage(
        err?.message || "Failed to reach Gemini. Your conversation state is preserved; please retry."
      );
    } finally {
      setIsSending(false);
    }
  };

  // Convert conversation to a Journal Entry in Firestore!
  const handleSaveAsJournalEntry = async () => {
    if (!user || messages.length === 0) return;
    setIsSavingEntry(true);
    setErrorMessage(null);

    try {
      const formattedContent = messages
        .filter((m) => m.id !== "m_welcome")
        .map(
          (m) =>
            `**${m.role === "user" ? user.displayName || "Me" : "Gemini Reflection"}**: ${
              m.content
            }`
        )
        .join("\n\n---\n\n");

      const entryId = await createJournalEntry(user.uid, {
        title: `Dialogue: ${currentConversation?.title || "Reflection Session"}`,
        content: formattedContent,
        mood: "reflective",
        tags: ["gemini-conversation", "dialogue"],
      });

      setSuccessToast("Saved as a journal entry in your Firestore vault!");
      setTimeout(() => setSuccessToast(null), 3000);
      onSavedAsJournalEntry(entryId);
    } catch (err: any) {
      console.error("Save as journal entry error:", err);
      setErrorMessage("Failed to save conversation as a journal entry.");
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!user) return;
    try {
      await deleteConversation(user.uid, convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (currentConversation?.id === convId) {
        if (remaining.length > 0) {
          selectConversation(remaining[0]);
        } else {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[740px]">
        {/* Left: Saved Conversations List (4 cols) */}
        <div className="hidden md:flex lg:col-span-4 flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <h3 className="font-bold text-sm text-slate-900">Conversations</h3>
            </div>
            <button
              id="chat-new-conversation-btn"
              onClick={startNewConversation}
              className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {conversations.map((conv) => {
              const isSelected = currentConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group text-left ${
                    isSelected
                      ? "bg-violet-50/70 border-violet-200 text-violet-950 font-semibold"
                      : "bg-white border-transparent hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs truncate">{conv.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {conversations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                No past conversations. Your multi-turn chats will be stored here.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Private account • UID isolated</span>
          </div>
        </div>

        {/* Right: Active Chat Area (8 cols) */}
        <div className="col-span-1 md:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Chat Bar */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                  {currentConversation?.title || "Gemini Reflection Dialogue"}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Gemini 2.5 Flash</span>
                  <span>•</span>
                  <span className="text-violet-700 font-semibold">Multi-Turn Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="chat-save-as-entry-btn"
                onClick={handleSaveAsJournalEntry}
                disabled={isSavingEntry || messages.length <= 1}
                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold rounded-lg border border-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="Convert this discussion into a saved Journal Entry"
              >
                {isSavingEntry ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5" />
                )}
                <span>Save as Entry</span>
              </button>

              <button
                id="chat-clear-btn"
                onClick={startNewConversation}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Start a new conversation"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-violet-600 text-white rounded-tr-xs shadow-sm"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-sm whitespace-pre-wrap"
                    }`}
                  >
                    {msg.content}
                    <div
                      className={`text-[10px] mt-1.5 text-right ${
                        isUser ? "text-violet-200" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="p-3.5 bg-white border border-violet-100 rounded-2xl rounded-tl-xs shadow-sm flex items-center gap-2 text-xs text-violet-700 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  <span>Gemini is thoughtfully reflecting...</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Writing Prompts Suggestion Pills (Shown if conversation has <= 2 messages) */}
          {messages.length <= 2 && (
            <div className="p-3 bg-violet-50/50 border-t border-violet-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-bold text-violet-800 shrink-0">Try asking:</span>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 bg-white hover:bg-violet-100 text-violet-900 border border-violet-200 rounded-full text-[11px] shrink-0 transition-colors cursor-pointer font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Input Box */}
          <div className="p-3.5 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="chat-message-input"
                type="text"
                placeholder="Message Gemini... (e.g. 'Help me unpack how I handled a tough conversation today')"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isSending}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                id="chat-send-btn"
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg shadow-sm shadow-violet-200 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-violet-600" />
              <span>
                Gemini assists with journaling & reflection. MindVault never uses AI for clinical therapy or medical diagnosis.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
