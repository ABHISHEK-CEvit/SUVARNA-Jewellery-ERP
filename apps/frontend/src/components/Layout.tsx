import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MetalRateTicker } from './MetalRateTicker';
import {
  Gem,
  LogOut,
  ShieldCheck,
  UserCheck,
  LayoutDashboard,
  Users,
  Layers,
  Settings,
  Receipt,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  ratesRefreshKey?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onNavigate,
  ratesRefreshKey = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Sales & Billing', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'settings', label: 'Shop Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/10">
              <Gem className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">SUVARNA</span>
                <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  Phase 3
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Jewellery ERP</span>
            </div>
          </div>

          {/* Metal Rate Ticker */}
          <div className="hidden lg:block">
            <MetalRateTicker refreshTrigger={ratesRefreshKey} />
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              {user?.role === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline">
                {user?.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                {user?.role}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout session"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/30 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Rates Ticker Bar */}
        <div className="lg:hidden px-4 py-1.5 border-t border-slate-800/60 bg-slate-950/80 flex justify-center">
          <MetalRateTicker refreshTrigger={ratesRefreshKey} />
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 border-t border-slate-800 bg-slate-900/60">
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-600">
        SUVARNA Jewellery ERP &bull; Modular Monolith &bull; Bill-Centric Design for Small Jewellers &bull; Phase 3
      </footer>
    </div>
  );
};
