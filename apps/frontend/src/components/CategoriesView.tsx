import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CategoryDto, CreateCategoryInput } from '@jewellery-erp/shared';
import {
  Tag,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Layers,
  Sparkles,
  Percent,
} from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [metalFilter, setMetalFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    metalType: 'GOLD',
    defaultPurity: '916',
    defaultHsnCode: '7113',
    gstRate: 3.0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/v1/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      metalType: 'GOLD',
      defaultPurity: '916',
      defaultHsnCode: '7113',
      gstRate: 3.0,
      isActive: true,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      metalType: cat.metalType,
      defaultPurity: cat.defaultPurity || '',
      defaultHsnCode: cat.defaultHsnCode,
      gstRate: cat.gstRate,
      isActive: cat.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleStatus = async (cat: CategoryDto) => {
    if (!isAdmin) return;
    try {
      const res = await api.patch(`/api/v1/categories/${cat.id}/toggle-status`);
      if (res.data?.success) {
        setSuccessMessage(res.data.message);
        fetchCategories();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle category status');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingCategory) {
        const res = await api.put(`/api/v1/categories/${editingCategory.id}`, formData);
        if (res.data?.success) {
          setSuccessMessage(res.data.message || 'Category updated successfully');
          setModalOpen(false);
          fetchCategories();
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      } else {
        const res = await api.post('/api/v1/categories', formData);
        if (res.data?.success) {
          setSuccessMessage(res.data.message || 'Category created successfully');
          setModalOpen(false);
          fetchCategories();
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMetal = metalFilter === 'ALL' || cat.metalType === metalFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && cat.isActive) ||
      (statusFilter === 'INACTIVE' && !cat.isActive);
    return matchesSearch && matchesMetal && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Role Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Jewellery Categories</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic line-item categories for bill-centric sales. No pre-created SKUs or barcodes required.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isAdmin && (
            <span className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-medium">
              Read-Only (Staff Mode)
            </span>
          )}
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Success / Error Alerts */}
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

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search category name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Metal Type Filter */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'GOLD', 'SILVER', 'PLATINUM', 'DIAMOND', 'OTHER'].map((metal) => (
              <button
                key={metal}
                onClick={() => setMetalFilter(metal)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  metalFilter === metal
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {metal === 'ALL' ? 'All Metals' : metal}
              </button>
            ))}
          </div>

          {/* Status Filter */}
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

      {/* Categories Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-4 py-3.5">Metal Type</th>
                <th className="px-4 py-3.5">Default Purity</th>
                <th className="px-4 py-3.5">HSN Code</th>
                <th className="px-4 py-3.5">Configured GST</th>
                <th className="px-4 py-3.5">Status</th>
                {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-8 text-center text-slate-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-5 py-8 text-center text-slate-500">
                    No categories found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-100 flex items-center space-x-2">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>{cat.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono font-semibold text-[11px] ${
                          cat.metalType === 'GOLD'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : cat.metalType === 'SILVER'
                            ? 'bg-slate-400/10 text-slate-300 border border-slate-400/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        {cat.metalType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono">
                      {cat.defaultPurity || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono">{cat.defaultHsnCode}</td>
                    <td className="px-4 py-3.5 font-mono text-amber-300">
                      {cat.gstRate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3.5">
                      {cat.isActive ? (
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
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`text-xs px-2 py-1 rounded-lg border font-medium transition-all ${
                            cat.isActive
                              ? 'border-red-500/30 text-red-400 hover:bg-red-950/40'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40'
                          }`}
                        >
                          {cat.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal (Admin Only) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
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
                  Category Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond Necklace, Gold Bangle, Ring"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Metal Type</label>
                  <select
                    value={formData.metalType}
                    onChange={(e) => setFormData({ ...formData, metalType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="GOLD">GOLD</option>
                    <option value="SILVER">SILVER</option>
                    <option value="PLATINUM">PLATINUM</option>
                    <option value="DIAMOND">DIAMOND</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Default Purity</label>
                  <input
                    type="text"
                    placeholder="e.g. 916, 750, 925"
                    value={formData.defaultPurity || ''}
                    onChange={(e) => setFormData({ ...formData, defaultPurity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Default HSN Code</label>
                  <input
                    type="text"
                    required
                    placeholder="7113"
                    value={formData.defaultHsnCode}
                    onChange={(e) => setFormData({ ...formData, defaultHsnCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    GST Rate % (Configurable)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={formData.gstRate}
                      onChange={(e) =>
                        setFormData({ ...formData, gstRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/30"
                />
                <label htmlFor="isActive" className="text-slate-300 select-none">
                  Category is Active for billing
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
