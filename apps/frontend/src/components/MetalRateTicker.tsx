import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Coins, RefreshCw } from 'lucide-react';

interface MetalRates {
  gold22kRate: number;
  gold24kRate: number;
  silverRate: number;
  updatedAt: string;
}

export const MetalRateTicker: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
  const [rates, setRates] = useState<MetalRates | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/settings/rates');
      if (res.data?.success && res.data?.data) {
        setRates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metal rates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [refreshTrigger]);

  if (loading && !rates) {
    return (
      <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 animate-pulse">
        <Coins className="w-4 h-4 text-amber-500/50" />
        <span>Loading daily metal rates...</span>
      </div>
    );
  }

  if (!rates) return null;

  const formattedDate = new Date(rates.updatedAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-900/90 border border-slate-800/80 px-3 py-1 rounded-xl text-xs shadow-inner">
      <div className="flex items-center space-x-1.5 text-amber-400 font-semibold border-r border-slate-800 pr-2.5">
        <Coins className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Daily Rates</span>
        <span className="text-[10px] text-slate-400 font-normal">({formattedDate})</span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 text-[11px]">Gold 22K:</span>
          <span className="font-mono font-bold text-amber-300">₹{rates.gold22kRate.toLocaleString('en-IN')}/g</span>
        </div>

        <div className="hidden md:flex items-center space-x-1 border-l border-slate-800 pl-2">
          <span className="text-slate-400 text-[11px]">Gold 24K:</span>
          <span className="font-mono font-bold text-amber-400">₹{rates.gold24kRate.toLocaleString('en-IN')}/g</span>
        </div>

        <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
          <span className="text-slate-400 text-[11px]">Silver:</span>
          <span className="font-mono font-bold text-slate-200">₹{rates.silverRate.toLocaleString('en-IN')}/g</span>
        </div>
      </div>

      <button
        onClick={fetchRates}
        title="Refresh live rates"
        className="text-slate-500 hover:text-amber-400 p-1 hover:bg-slate-800 rounded-lg transition-colors ml-1"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
