import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { Shield, Database, Lock, CheckCircle2, UserCheck, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading ERP Session...
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Phase 1 Verification Header */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Phase 1 Completed & Verified</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-100">Welcome, {user.name}</h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Project foundation, bill-centric PostgreSQL database schema, NestJS backend API, and secure HTTP-Only cookie authentication are online.
              </p>
            </div>

            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-slate-500 uppercase font-semibold">Active Role</span>
              <span className="text-sm font-bold text-amber-400 mt-0.5">{user.role}</span>
            </div>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center space-x-3 text-amber-400 mb-3">
              <Database className="w-5 h-5" />
              <h3 className="font-semibold text-slate-200 text-sm">Bill-Centric Database</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              PostgreSQL 16 running via Prisma ORM. Schemas for Sales Invoices, Items, Categories, Customers, and Customer Ledgers are migrated. Zero mandatory SKUs.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center space-x-3 text-amber-400 mb-3">
              <Lock className="w-5 h-5" />
              <h3 className="font-semibold text-slate-200 text-sm">Cookie Authentication</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stateful session security via HTTP-Only, SameSite cookies. XSS-protected auth guard guarding API endpoints (`/api/v1/auth/*`).
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center space-x-3 text-amber-400 mb-3">
              <Shield className="w-5 h-5" />
              <h3 className="font-semibold text-slate-200 text-sm">Role-Based Access</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              NestJS `@Roles('ADMIN', 'STAFF')` guards enforcing strict authorization boundaries. Currently logged in as <strong className="text-amber-400">{user.role}</strong>.
            </p>
          </div>
        </div>

        {/* Active Session Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>Active Auth Context Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-medium block mb-1">User ID</span>
              <span className="font-mono text-slate-300 font-semibold">{user.id}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-medium block mb-1">Email</span>
              <span className="text-slate-300 font-semibold">{user.email}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-medium block mb-1">Role</span>
              <span className="text-amber-400 font-bold">{user.role}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-medium block mb-1">Account Status</span>
              <span className="text-emerald-400 font-semibold">{user.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
