import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import { EntryModal } from "./components/EntryModal";
import { LandingView } from "./views/LandingView";
import { DashboardView } from "./views/DashboardView";
import { JournalView } from "./views/JournalView";
import { ChatView } from "./views/ChatView";
import { ReflectionView } from "./views/ReflectionView";
import { SettingsView } from "./views/SettingsView";
import { JournalEntry } from "./types";
import {
  createJournalEntry,
  updateJournalEntry,
  subscribeJournalEntries,
} from "./services/firestoreService";
import { Loader2 } from "lucide-react";

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntryToOpen, setSelectedEntryToOpen] = useState<JournalEntry | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    const unsubscribe = subscribeJournalEntries(user.uid, (data) => {
      setEntries(data);
    });
    return () => unsubscribe();
  }, [user]);

  // Global handler for creating or editing an entry
  const handleSaveEntry = async (entryData: {
    title: string;
    content: string;
    mood: JournalEntry["mood"];
    tags: string[];
  }) => {
    if (!user) return;
    if (editingEntry) {
      await updateJournalEntry(user.uid, editingEntry.id, {
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        tags: entryData.tags,
      });
    } else {
      await createJournalEntry(user.uid, {
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        tags: entryData.tags,
      });
    }
  };

  const openNewEntryModal = () => {
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const openEditEntryModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleOpenEntryFromDashboard = (entry: JournalEntry) => {
    setSelectedEntryToOpen(entry);
    setActiveTab("journal");
  };

  const handleSavedAsJournalFromChat = (entryId: string) => {
    setActiveTab("journal");
  };

  // 1. Initial Authentication Check
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200 mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Connecting to MindVault...</p>
        <p className="text-xs text-slate-400 mt-1">Verifying Firebase Authentication</p>
      </div>
    );
  }

  // 2. Unauthenticated User State -> Show Landing Page
  if (!user) {
    return <LandingView />;
  }

  // 3. Authenticated Application Layout
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewEntryClick={openNewEntryModal}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewEntryClick={openNewEntryModal}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {activeTab === "dashboard" && (
            <DashboardView
              setActiveTab={setActiveTab}
              onNewEntryClick={openNewEntryModal}
              onOpenEntry={handleOpenEntryFromDashboard}
              entries={entries}
            />
          )}

          {activeTab === "journal" && (
            <JournalView
              onNewEntryClick={openNewEntryModal}
              onEditEntryClick={openEditEntryModal}
              selectedEntryToOpen={selectedEntryToOpen}
            />
          )}

          {activeTab === "chat" && (
            <ChatView onSavedAsJournalEntry={handleSavedAsJournalFromChat} />
          )}

          {activeTab === "reflections" && (
            <ReflectionView
              onNewEntryClick={openNewEntryModal}
              onOpenEntry={(entryId) => {
                setActiveTab("journal");
              }}
            />
          )}

          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* New / Edit Journal Entry Modal */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
