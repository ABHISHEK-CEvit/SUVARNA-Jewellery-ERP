import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Shield,
  Database,
  Lock,
  CheckCircle2,
  Users,
  Layers,
  Coins,
  ArrowUpRight,
  Sparkles,
  Sliders,
  Scale,
  Percent,
} from 'lucide-react';

interface DashboardStats {
  customerCount: number;
  categoryCount: number;
  shopName: string;
  defaultGstRate: number;
  gold22kRate: number;
  gold24kRate: number;
  silverRate: number;
}

export const DashboardView: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        const [settingsRes, customersRes, categoriesRes] = await Promise.all([
          api.get('/api/v1/settings'),
          api.get('/api/v1/customers?limit=1'),
          api.get('/api/v1/categories'),
        ]);

        const settings = settingsRes.data?.data;
        const customersData = customersRes.data?.data;
        const categories = categoriesRes.data?.data;

        setStats({
          customerCount: customersData?.total || 0,
          categoryCount: categories?.length || 0,
          shopName: settings?.shopName || 'Jewellery Shop',
          defaultGstRate: settings?.defaultGstRate || 3.0,
          gold22kRate: settings?.todayGold22kRate || 0,
          gold24kRate: settings?.todayGold24kRate || 0,
          silverRate: settings?.todaySilverRate || 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phase 1 & Phase 2 Active</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome to {stats?.shopName || 'Jewellery ERP'}, {user?.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Sales-centric, bill-focused architecture designed for fast counter operation. Shop settings, configurable GST rates, precious metal rates, categories, and customer ledger management are fully operational.
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-slate-500 uppercase font-semibold">Active Role</span>
            <span className="text-sm font-bold text-amber-400 mt-0.5">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Live Metal Rates Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Gold 22K (916)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            ₹{stats ? stats.gold22kRate.toLocaleString('en-IN') : '...'}
            <span className="text-xs text-slate-400 font-normal"> /g</span>
          </div>
          <p className="text-[11px] text-slate-500">Hallmark standard</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Gold 24K (Fine)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            ₹{stats ? stats.gold24kRate.toLocaleString('en-IN') : '...'}
            <span className="text-xs text-slate-400 font-normal"> /g</span>
          </div>
          <p className="text-[11px] text-slate-500">99.9% Pure gold</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Silver (999/925)</span>
            <Coins className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            ₹{stats ? stats.silverRate.toLocaleString('en-IN') : '...'}
            <span className="text-xs text-slate-400 font-normal"> /g</span>
          </div>
          <p className="text-[11px] text-slate-500">Bullion & ornaments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Configurable Default GST</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {stats ? stats.defaultGstRate.toFixed(2) : '3.00'}%
          </div>
          <p className="text-[11px] text-slate-500">Dynamic store-wide rate</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('customers')}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Users className="w-5 h-5" />
              <h3 className="font-semibold text-slate-200 text-sm">Customer Directory</h3>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono mb-1">
            {stats?.customerCount ?? 0}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage customer records, tax identifiers (PAN/GSTIN), and explicit Debit/Credit opening ledger balances.
          </p>
        </div>

        <div
          onClick={() => onNavigate('categories')}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Layers className="w-5 h-5" />
              <h3 className="font-semibold text-slate-200 text-sm">Jewellery Categories</h3>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono mb-1">
            {stats?.categoryCount ?? 0}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dynamic categories (Rings, Bangles, Chains, etc.) with custom purity, HSN codes, and category-level GST overrides. Zero SKUs.
          </p>
        </div>

        <div
          onClick={() => onNavigate('settings')}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-400">
              <Sliders className="w-5 h-5" />
              <h3 className="font-semibold text-slate-200 text-sm">Shop Settings & Rates</h3>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="text-sm font-semibold text-slate-200 mb-1">
            {stats?.shopName || 'Business Profile'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure shop identity, invoice prefix, default tax rate, and record historical daily metal rate snapshots.
          </p>
        </div>
      </div>

      {/* System Integrity Highlights */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider text-[11px]">
          Architectural Principles & Safeguards Enforced
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>Bill-Centric Data</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              No mandatory pre-cataloged SKUs or barcodes. Items are recorded dynamically during invoice creation.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Scale className="w-4 h-4" />
              <span>Financial Precision</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Currency stored in Decimal(12,2) and weights in Decimal(12,3) milligram precision. No floating point errors.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Lock className="w-4 h-4" />
              <span>RBAC & Session Guards</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              HTTP-Only cookie auth. NestJS Guards strictly enforce Admin vs. Staff role access at the API layer.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold">
              <Shield className="w-4 h-4" />
              <span>Ledger Integrity</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Opening balances create immutable <code>CustomerLedgerEntry</code> records with Debit/Credit semantics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
