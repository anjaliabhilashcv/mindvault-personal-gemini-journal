import React from "react";
import {
  Shield,
  Sparkles,
  Lock,
  Database,
  Cpu,
  Cloud,
  CheckCircle,
  ArrowRight,
  Loader2,
  BookOpen,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LandingView: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-xl tracking-tight">MindVault</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-violet-100 text-violet-800 rounded-full">
                AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-500">Personal Gemini Journal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="landing-signin-nav-btn"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            {isSigningIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col items-center text-center justify-center">
        {/* Security badge pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-100/80 border border-violet-200 rounded-full text-xs font-semibold text-violet-800 mb-6">
          <Shield className="w-3.5 h-3.5 text-violet-600" />
          <span>Firebase Authenticated • Strict UID Data Isolation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tight max-w-3xl leading-[1.15]">
          Your private sanctuary for <span className="text-violet-600">thoughtful reflections</span> & AI insights.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          MindVault combines private journal encryption with the intelligence of Google Gemini.
          Explore multi-turn brainstorming, instant AI summarization, and an original Personal Reflection Dashboard.
        </p>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-w-md text-left flex items-start justify-between gap-3">
            <span>{error}</span>
            <button onClick={clearError} className="font-bold text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="landing-google-signin-btn"
            onClick={handleSignIn}
            disabled={isSigningIn || loading}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-violet-900 active:bg-black text-white font-medium text-sm rounded-lg shadow-md shadow-slate-950/10 transition-all flex items-center justify-center gap-3 cursor-pointer group"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4 text-violet-300 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-violet-600" />
          <span>Zero passwords stored. Protected by Google Identity & Cloud Firestore.</span>
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-violet-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Private Firestore Vault</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every journal entry is strictly bound to your authenticated Firebase UID.
              Security rules prevent cross-user data exposure at the database layer.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-violet-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Multi-Turn Gemini Companion</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Hold real, thoughtful conversations to brainstorm, organize reflections, and generate
              custom writing prompts with zero client-side key leakage.
            </p>
          </div>

          <div className="p-6 bg-violet-50/50 rounded-2xl border border-violet-200 shadow-sm hover:border-violet-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-200 text-violet-900 px-2.5 py-0.5 rounded-full">
                AI-POWERED INSIGHTS
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Personal Reflection Dashboard</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Synthesizes recurring themes, longitudinal growth trends, and weekly AI reflections
              computed exclusively from your personal journal archives.
            </p>
          </div>
        </div>

        {/* 4 Ideathon Pillars banner */}
        <div className="mt-14 w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 text-center mb-4">
            Four Core Production Pillars Enforced
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Firebase Auth</div>
                <div className="text-[11px] text-slate-500">Google Federated Sign-In</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Cloud Firestore</div>
                <div className="text-[11px] text-slate-500">Strict UID Rules Isolation</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Gemini Server API</div>
                <div className="text-[11px] text-slate-500">Zero Browser Key Leakage</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-900">Cloud Run Ready</div>
                <div className="text-[11px] text-slate-500">Container Native Deploy</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>
          MindVault • Built for the Google Cloud Run & AI Studio Challenge • Private & Secure
        </p>
      </footer>
    </div>
  );
};
