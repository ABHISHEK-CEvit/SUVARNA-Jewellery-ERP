import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { CategoriesView } from './components/CategoriesView';
import { SettingsView } from './components/SettingsView';
import { BillingView } from './components/BillingView';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'billing' | 'customers' | 'categories' | 'settings'>('billing');
  const [ratesRefreshKey, setRatesRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm font-mono">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span>Loading SUVARNA ERP Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onNavigate={(tab) => setActiveTab(tab as any)}
      ratesRefreshKey={ratesRefreshKey}
    >
      {activeTab === 'dashboard' && (
        <DashboardView onNavigate={(tab) => setActiveTab(tab as any)} />
      )}
      {activeTab === 'billing' && <BillingView />}
      {activeTab === 'customers' && <CustomersView />}
      {activeTab === 'categories' && <CategoriesView />}
      {activeTab === 'settings' && (
        <SettingsView onRatesUpdated={() => setRatesRefreshKey((prev) => prev + 1)} />
      )}
    </Layout>
  );
};
