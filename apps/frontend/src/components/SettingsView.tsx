import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  BusinessSettingsDto,
  DailyMetalRateDto,
  UpdateBusinessSettingsInput,
} from '@jewellery-erp/shared';
import {
  Settings,
  Building2,
  Coins,
  Percent,
  Receipt,
  Landmark,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  ShieldAlert,
} from 'lucide-react';

export const SettingsView: React.FC<{ onRatesUpdated?: () => void }> = ({ onRatesUpdated }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [settings, setSettings] = useState<BusinessSettingsDto | null>(null);
  const [history, setHistory] = useState<DailyMetalRateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UpdateBusinessSettingsInput>({
    shopName: '',
    tagline: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    invoicePrefix: 'INV',
    termsConditions: '',
    defaultGstRate: 3.0,
    todayGold22kRate: 0,
    todayGold24kRate: 0,
    todaySilverRate: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, historyRes] = await Promise.all([
        api.get('/api/v1/settings'),
        api.get('/api/v1/settings/rates-history'),
      ]);

      if (settingsRes.data?.success) {
        const s: BusinessSettingsDto = settingsRes.data.data;
        setSettings(s);
        setFormData({
          shopName: s.shopName,
          tagline: s.tagline || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || 'Maharashtra',
          stateCode: s.stateCode || '27',
          phone: s.phone || '',
          email: s.email || '',
          gstin: s.gstin || '',
          pan: s.pan || '',
          bankName: s.bankName || '',
          bankAccountNo: s.bankAccountNo || '',
          bankIfsc: s.bankIfsc || '',
          invoicePrefix: s.invoicePrefix || 'INV',
          termsConditions: s.termsConditions || '',
          defaultGstRate: s.defaultGstRate,
          todayGold22kRate: s.todayGold22kRate,
          todayGold24kRate: s.todayGold24kRate,
          todaySilverRate: s.todaySilverRate,
        });
      }

      if (historyRes.data?.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load business settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.put('/api/v1/settings', formData);
      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Business settings updated successfully');
        setSettings(res.data.data);
        if (onRatesUpdated) onRatesUpdated();
        fetchData();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-500 text-xs">
        Loading business settings and metal rates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Shop & Business Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Store identity, configurable GST rules, today's precious metal rates, and historical logs.
          </p>
        </div>

        {!isAdmin ? (
          <div className="flex items-center space-x-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl font-medium">
            <ShieldAlert className="w-4 h-4" />
            <span>Staff Mode (Read-Only)</span>
          </div>
        ) : (
          <button
            type="submit"
            form="settings-form"
            disabled={submitting}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Precious Metal Rates Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Today's Precious Metal Rates</h2>
            </div>
            {settings?.updatedAt && (
              <span className="text-[11px] text-slate-400">
                Last Rate Date:{' '}
                <strong className="text-slate-200">
                  {new Date(settings.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Rates entered here are automatically snapshotted to the <code>DailyMetalRate</code> log with today's date for historical auditing and live counter pricing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <label className="block text-amber-400 font-semibold text-xs">
                Gold 22K (916) Rate / gram
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!isAdmin}
                  value={formData.todayGold22kRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      todayGold22kRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <label className="block text-amber-400 font-semibold text-xs">
                Gold 24K (Fine 999) Rate / gram
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!isAdmin}
                  value={formData.todayGold24kRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      todayGold24kRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <label className="block text-slate-200 font-semibold text-xs">
                Silver Rate / gram
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  disabled={!isAdmin}
                  value={formData.todaySilverRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      todaySilverRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shop Identity & Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Shop & Business Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Shop Name <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Tagline / Motto</label>
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. Pure & Hallmark Jewellery"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Contact Email</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Shop Address</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">City</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-medium mb-1">State</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">State Code</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.stateCode || ''}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Configurable Tax & Invoicing Rules */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Percent className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Tax & Invoicing Configuration</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-slate-300 font-semibold mb-1">
                Default GST Rate (%) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  disabled={!isAdmin}
                  value={formData.defaultGstRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultGstRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
                />
                <Percent className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Configurable store-wide default tax (never hardcoded). Overridden only by explicit category rates.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-slate-300 font-semibold mb-1">
                Invoice Number Prefix <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                placeholder="e.g. INV, SJ"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500/50 disabled:opacity-75 uppercase"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Generated bills format: <code>{formData.invoicePrefix}-2026-0001</code>
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <label className="block text-slate-300 font-semibold mb-1">Shop GSTIN</label>
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. 27AAAAA0000A1Z5"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500/50 disabled:opacity-75 uppercase"
              />
              <p className="text-[11px] text-slate-500 mt-1">For B2B & Tax Invoicing splits</p>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-400 font-medium mb-1">
                Invoice Terms & Conditions Note
              </label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                placeholder="Terms and conditions printed at the bottom of customer bills"
                value={formData.termsConditions || ''}
                onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75 resize-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Bank & Settlement Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Landmark className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Bank & Payment Settlement</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Bank Name</label>
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. State Bank of India"
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Account Number</label>
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. 123456789012"
                value={formData.bankAccountNo || ''}
                onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">IFSC Code</label>
              <input
                type="text"
                disabled={!isAdmin}
                placeholder="e.g. SBIN0001234"
                value={formData.bankIfsc || ''}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 uppercase font-mono disabled:opacity-75"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Historical Metal Rates Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Historical Metal Rate Snapshots</h2>
          </div>
          <span className="text-xs text-slate-500">{history.length} snapshots recorded</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Effective Date (rateDate)</th>
                <th className="px-4 py-3 text-right">Gold 22K (₹/g)</th>
                <th className="px-4 py-3 text-right">Gold 24K (₹/g)</th>
                <th className="px-4 py-3 text-right">Silver (₹/g)</th>
                <th className="px-5 py-3 text-right">Recorded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-slate-500 font-sans">
                    No historical rate snapshots recorded yet. Update settings to record the first snapshot.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-900/50">
                    <td className="px-5 py-2.5 font-bold text-amber-300">{record.rateDate}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                      ₹{record.gold22kRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                      ₹{record.gold24kRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                      ₹{record.silverRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-2.5 text-right text-slate-500 font-sans text-[10px]">
                      {new Date(record.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
