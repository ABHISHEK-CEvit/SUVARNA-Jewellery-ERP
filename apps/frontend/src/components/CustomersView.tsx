import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CustomerDto,
  CustomerLedgerEntryDto,
  CreateCustomerInput,
  UpdateCustomerInput,
  PaginatedResponse,
} from '@jewellery-erp/shared';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Edit2,
  Trash2,
  CreditCard,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Customer Create / Edit Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pan: '',
    gstin: '',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Profile & Ledger Modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntryDto[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const fetchCustomers = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: p,
        limit: 15,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'ALL') params.isActive = statusFilter === 'ACTIVE';

      const res = await api.get('/api/v1/customers', { params });
      if (res.data?.success) {
        const data: PaginatedResponse<CustomerDto> = res.data.data;
        setCustomers(data.items);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [searchQuery, statusFilter]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pan: '',
      gstin: '',
      openingBalance: 0,
      openingBalanceType: 'DEBIT',
    });
    setFormError(null);
    setFormModalOpen(true);
  };

  const openEditModal = (cust: CustomerDto) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      pan: cust.pan || '',
      gstin: cust.gstin || '',
      openingBalance: cust.openingBalance,
      openingBalanceType: cust.openingBalanceType,
    });
    setFormError(null);
    setFormModalOpen(true);
  };

  const openProfileModal = async (cust: CustomerDto) => {
    setSelectedCustomer(cust);
    setProfileModalOpen(true);
    setLoadingLedger(true);
    try {
      const res = await api.get(`/api/v1/customers/${cust.id}/ledger`);
      if (res.data?.success) {
        setLedgerEntries(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load ledger', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleToggleStatus = async (cust: CustomerDto) => {
    try {
      const res = await api.patch(`/api/v1/customers/${cust.id}/toggle-status`);
      if (res.data?.success) {
        setSuccessMessage(res.data.message);
        fetchCustomers(page);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update customer status');
    }
  };

  const handleDelete = async (cust: CustomerDto) => {
    if (!window.confirm(`Are you sure you want to delete customer "${cust.name}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/api/v1/customers/${cust.id}`);
      if (res.data?.success) {
        setSuccessMessage(res.data.message);
        fetchCustomers(page);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Customer cannot be deleted. Please set status to Inactive instead.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Customer name is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingCustomer) {
        const updatePayload: UpdateCustomerInput = {
          name: formData.name.trim(),
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          pan: formData.pan || null,
          gstin: formData.gstin || null,
        };
        const res = await api.put(`/api/v1/customers/${editingCustomer.id}`, updatePayload);
        if (res.data?.success) {
          setSuccessMessage(res.data.message || 'Customer updated successfully');
          setFormModalOpen(false);
          fetchCustomers(page);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        const res = await api.post('/api/v1/customers', formData);
        if (res.data?.success) {
          setSuccessMessage(res.data.message || 'Customer created successfully');
          setFormModalOpen(false);
          fetchCustomers(1);
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Customer Management</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directory, tax identifiers, running ledger balances with explicit Debit / Credit semantics.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer by name, phone, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Total Customers: <strong className="text-slate-200">{total}</strong>
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Tax IDs</th>
                <th className="px-4 py-3.5">Opening Balance</th>
                <th className="px-4 py-3.5">Current Balance</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => {
                  const isDebit = cust.currentBalance > 0;
                  const isCredit = cust.currentBalance < 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-100">{cust.name}</div>
                        <div className="text-[11px] text-slate-500">ID: {cust.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{cust.phone || '—'}</span>
                        </div>
                        {cust.email && (
                          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-600" />
                            <span>{cust.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {cust.city ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>
                              {cust.city}
                              {cust.state ? `, ${cust.state}` : ''}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[11px] font-mono text-slate-400">
                        {cust.gstin && <div>GST: {cust.gstin}</div>}
                        {cust.pan && <div>PAN: {cust.pan}</div>}
                        {!cust.gstin && !cust.pan && '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-medium text-slate-300">
                          ₹{cust.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            cust.openingBalanceType === 'DEBIT'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {cust.openingBalanceType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div
                          className={`font-mono font-bold ${
                            isDebit
                              ? 'text-amber-400'
                              : isCredit
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          ₹{Math.abs(cust.currentBalance).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            isDebit
                              ? 'bg-amber-500/10 text-amber-400'
                              : isCredit
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isDebit ? 'Receivable (Due)' : isCredit ? 'Advance (Credit)' : 'Settled'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {cust.isActive ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <XCircle className="w-3 h-3" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openProfileModal(cust)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                          title="View Profile & Ledger"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cust)}
                          className={`text-xs px-2 py-1 rounded-lg border font-medium transition-all ${
                            cust.isActive
                              ? 'border-red-500/30 text-red-400 hover:bg-red-950/40'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {cust.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(cust)}
                            className="p-1.5 hover:bg-red-950/50 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                            title="Delete Customer (No History Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-950/60 border-t border-slate-800 px-5 py-3 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <strong className="text-slate-200">{page}</strong> of{' '}
            <strong className="text-slate-200">{totalPages}</strong> ({total} total records)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (page > 1) {
                  setPage(page - 1);
                  fetchCustomers(page - 1);
                }
              }}
              disabled={page <= 1}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                if (page < totalPages) {
                  setPage(page + 1);
                  fetchCustomers(page + 1);
                }
              }}
              disabled={page >= totalPages}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 rounded-xl transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Create / Edit Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}</span>
              </h3>
              <button
                onClick={() => setFormModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Full Customer Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshchandra S. Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone / Mobile</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@gmail.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Street Address</label>
                <textarea
                  rows={2}
                  placeholder="Street / Flat / Colony address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={formData.pan || ''}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    value={formData.gstin || ''}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Opening Balance (Only configurable at registration to guarantee ledger consistency) */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Opening Balance</span>
                  </span>
                  {editingCustomer && (
                    <span className="text-[10px] text-slate-500 italic">
                      Locked to preserve CustomerLedgerEntry consistency
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!!editingCustomer}
                      value={formData.openingBalance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingBalance: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono disabled:opacity-50 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Balance Type</label>
                    <select
                      disabled={!!editingCustomer}
                      value={formData.openingBalanceType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingBalanceType: e.target.value as 'DEBIT' | 'CREDIT',
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 disabled:opacity-50 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="DEBIT">DEBIT (Customer owes shop)</option>
                      <option value="CREDIT">CREDIT (Advance / Shop owes customer)</option>
                    </select>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  A matching initial <code>CustomerLedgerEntry</code> will be automatically created in the ledger.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile & Ledger Drawer / Modal */}
      {profileModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-bold text-lg text-slate-100">{selectedCustomer.name}</h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      selectedCustomer.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {selectedCustomer.isActive ? 'Active Customer' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Customer ID: <span className="font-mono text-slate-300">{selectedCustomer.id}</span>
                </p>
              </div>

              <button
                onClick={() => setProfileModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                ✕
              </button>
            </div>

            {/* Profile Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">
                  Contact Information
                </span>
                <div className="space-y-1">
                  <div className="text-slate-200 font-mono flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedCustomer.phone || 'No phone recorded'}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="text-slate-400 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.city && (
                    <div className="text-slate-400 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {selectedCustomer.city}
                        {selectedCustomer.state ? `, ${selectedCustomer.state}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">
                  Tax Identifiers
                </span>
                <div className="space-y-1 font-mono">
                  <div className="text-slate-300">
                    <span className="text-slate-500">GSTIN: </span>
                    {selectedCustomer.gstin || 'Unregistered'}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500">PAN: </span>
                    {selectedCustomer.pan || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block">
                  Financial Position
                </span>
                <div>
                  <span className="text-slate-500 text-[11px]">Current Outstanding:</span>
                  <div
                    className={`font-mono font-bold text-base ${
                      selectedCustomer.currentBalance > 0
                        ? 'text-amber-400'
                        : selectedCustomer.currentBalance < 0
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    ₹
                    {Math.abs(selectedCustomer.currentBalance).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <span className="text-[10px] uppercase text-slate-400 font-medium">
                    {selectedCustomer.currentBalance > 0
                      ? 'Debit Balance (Due from Customer)'
                      : selectedCustomer.currentBalance < 0
                      ? 'Credit Balance (Advance Credit)'
                      : 'Settled (Zero Balance)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Ledger Statement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Customer Ledger Entries</span>
                </h4>
                <span className="text-xs text-slate-500">
                  {ledgerEntries.length} transaction entries recorded
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Entry Type</th>
                      <th className="px-4 py-2.5 text-right">Debit (₹)</th>
                      <th className="px-4 py-2.5 text-right">Credit (₹)</th>
                      <th className="px-4 py-2.5 text-right">Running Balance (₹)</th>
                      <th className="px-4 py-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {loadingLedger ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          Loading ledger statement...
                        </td>
                      </tr>
                    ) : ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          No ledger transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2.5 text-slate-400">{entry.date}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 text-[10px] font-sans font-bold">
                              {entry.entryType}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-200">
                            {entry.debitAmount > 0
                              ? `₹${entry.debitAmount.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                })}`
                              : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-emerald-400">
                            {entry.creditAmount > 0
                              ? `₹${entry.creditAmount.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                })}`
                              : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-100">
                            ₹
                            {entry.runningBalance.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400 font-sans text-xs">
                            {entry.remarks || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
