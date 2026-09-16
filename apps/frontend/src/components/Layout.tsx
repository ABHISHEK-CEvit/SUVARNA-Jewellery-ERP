import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Gem, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Topbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/10">
            <Gem className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight">Jewellery ERP</span>
            <span className="ml-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-medium">
              Phase 1
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            {user?.role === 'ADMIN' ? (
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-semibold text-slate-200">{user?.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-600">
        Jewellery ERP v1.0.0 &bull; Modular Monolith &bull; Bill-Centric Design for Small Jewellers
      </footer>
    </div>
  );
};
