import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Sparkles,
  Settings,
  LogOut,
  Shield,
  Plus,
  PenLine,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type NavTab = "dashboard" | "journal" | "chat" | "reflections" | "settings";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onNewEntryClick: () => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNewEntryClick,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "journal", label: "Journal Entries", icon: BookOpen },
    { id: "chat", label: "Chat with Gemini", icon: MessageSquare },
    {
      id: "reflections",
      label: "Reflections",
      icon: Sparkles,
      highlight: true,
      badge: "AI-POWERED INSIGHTS",
    },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-violet-200">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-xl tracking-tight">MindVault</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded-md">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Personal Gemini Journal</p>
            </div>
          </div>

          {/* Quick Action button */}
          <button
            id="sidebar-new-entry-btn"
            onClick={onNewEntryClick}
            className="w-full mt-5 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-sm font-medium rounded-lg shadow-sm shadow-violet-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <PenLine className="w-4 h-4" />
            <span>New Journal Entry</span>
          </button>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNavClick(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive
                      ? "bg-violet-50 text-violet-700 font-medium"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-normal"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isActive
                          ? "bg-violet-100 text-violet-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section with Security Shield & User Profile */}
        <div className="flex flex-col">
          {/* Security Shield Card from Sleek Interface design */}
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-900 rounded-xl p-3.5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                  Security Shield
                </span>
              </div>
              <div className="space-y-1 text-[11px] opacity-90 font-medium">
                <p className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Firebase Auth Active
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Cloud Run Protected
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span> Firestore Isolated
                </p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User Avatar"}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user?.displayName || "Alexander Chen"}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email || "alex@google.com"}</p>
              </div>
            </div>

            <button
              id="sidebar-logout-btn"
              onClick={logout}
              title="Sign Out of MindVault"
              className="text-slate-400 hover:text-red-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
