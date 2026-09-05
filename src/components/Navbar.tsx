import React from "react";
import { Menu, Plus, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NavTab } from "./Sidebar";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onNewEntryClick: () => void;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewEntryClick,
  onOpenMobileMenu,
}) => {
  const { user } = useAuth();

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Overview of your personal reflections and journal activity",
    },
    journal: {
      title: "Personal Journal",
      subtitle: "Secure, encrypted thoughts with AI summarization",
    },
    chat: {
      title: "Chat with Gemini",
      subtitle: "Multi-turn brainstorming and thoughtful journaling companion",
    },
    reflections: {
      title: "Personal Reflection Dashboard",
      subtitle: "AI-Powered longitudinal insights and recurring theme visualizer",
    },
    settings: {
      title: "Security & Settings",
      subtitle: "Inspect Firebase Auth, Firestore isolation, and Cloud Run specifications",
    },
  };

  const currentMeta = titles[activeTab] || titles.dashboard;

  return (
    <header
      id="app-navbar"
      className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30"
    >
      <div className="flex items-center gap-3">
        <button
          id="navbar-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight leading-none">
            {currentMeta.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 mt-1">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full border border-violet-200 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
          <span>Firestore UID Isolated</span>
        </div>

        {activeTab !== "chat" && (
          <button
            id="navbar-chat-quick-btn"
            onClick={() => setActiveTab("chat")}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
            <span>Chat AI</span>
          </button>
        )}

        <button
          id="navbar-new-entry-btn"
          onClick={onNewEntryClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-violet-200 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>

        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User Avatar"}
            className="w-8 h-8 rounded-full border border-slate-200 object-cover ml-1"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold ml-1">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
          </div>
        )}
      </div>
    </header>
  );
};
