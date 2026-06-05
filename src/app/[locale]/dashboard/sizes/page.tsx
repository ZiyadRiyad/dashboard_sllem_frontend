'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  DollarSign, 
  Plus, 
  Settings, 
  AlertCircle,
  Clock,
  Car,
  ChevronRight,
  TrendingUp,
  Trash2,
  X
} from 'lucide-react';

interface CategorySize {
  id: number;
  category_id: number;
  category_name: string;
  size_name: string;
  min_weight: string;
  max_weight: string;
  base_price: string;
  price_per_km: string;
  allowed_vehicle_type: string;
}

interface Category {
  id: number;
  name: string;
}

export default function SizesManagement() {
  const t = useTranslations();
  const [sizes, setSizes] = useState<CategorySize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [categoryId, setCategoryId] = useState('');
  const [sizeName, setSizeName] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [allowedVehicleType, setAllowedVehicleType] = useState('both');
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete State
  const [deletingSize, setDeletingSize] = useState<CategorySize | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sizesRes, categoriesRes] = await Promise.all([
        api.get('/admin/category-sizes'),
        api.get('/admin/categories'),
      ]);
      setSizes(sizesRes.data);
      setCategories(categoriesRes.data);
    } catch (e) {
      console.error('Failed to load configurations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (size: CategorySize) => {
    setEditingId(size.id);
    setCategoryId(size.category_id.toString());
    setSizeName(size.size_name);
    setMinWeight(parseFloat(size.min_weight).toString());
    setMaxWeight(parseFloat(size.max_weight).toString());
    setAllowedVehicleType(size.allowed_vehicle_type);
  };

  const handleClearForm = () => {
    setEditingId(null);
    setCategoryId('');
    setSizeName('');
    setMinWeight('');
    setMaxWeight('');
    setAllowedVehicleType('both');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !sizeName || minWeight === '' || maxWeight === '') return;

    setSubmitting(true);
    setError('');

    const payload = {
      categoryId: parseInt(categoryId),
      sizeName,
      minWeight: parseFloat(minWeight),
      maxWeight: parseFloat(maxWeight),
      allowedVehicleType,
    };

    try {
      if (editingId) {
        await api.put(`/admin/category-sizes/${editingId}`, payload);
      } else {
        await api.post('/admin/category-sizes', payload);
      }
      handleClearForm();
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || t('sizes.save_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSize = async () => {
    if (!deletingSize) return;
    setDeleting(true);
    setModalError('');

    try {
      await api.delete(`/admin/category-sizes/${deletingSize.id}`);
      setDeletingSize(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.error || t('sizes.delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <Settings className="h-6 w-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">{t('sizes.title')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-md shadow-xl h-fit">
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-emerald-400" />
            <span>{editingId ? t('sizes.edit_title') : t('sizes.add')}</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 block uppercase">
                {t('sizes.category')}
              </label>
              <select
                required
                disabled={editingId !== null}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">{t('sizes.choose_category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Size Name */}
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 block uppercase">
                {t('sizes.name')}
              </label>
              <input
                type="text"
                required
                placeholder={t('sizes.name_placeholder')}
                value={sizeName}
                onChange={(e) => setSizeName(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            {/* Weights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-400 block uppercase">
                  {t('sizes.min_weight_label')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-400 block uppercase">
                  {t('sizes.max_weight_label')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="5"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>



            {/* Vehicle limitation */}
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 block uppercase">
                {t('sizes.allowed_vehicle')}
              </label>
              <select
                required
                value={allowedVehicleType}
                onChange={(e) => setAllowedVehicleType(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="both">{t('sizes.vehicle_both')}</option>
                <option value="motorcycle">{t('sizes.vehicle_motorcycle')}</option>
                <option value="car">{t('sizes.vehicle_car')}</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3">
              {editingId && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex-1 rounded-2xl border border-slate-850 py-3.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer transition"
                >
                  {t('common.clear')}
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {submitting ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>

        {/* Pricing Matrix List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-md shadow-xl flex flex-col">
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Car className="h-4.5 w-4.5 text-cyan-400" />
            <span>{t('sizes.configured_matrices')}</span>
          </h3>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400">
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs font-semibold">{t('common.loading')}</span>
              </div>
            </div>
          ) : sizes.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
              {t('sizes.no_sizes')}
            </div>
          ) : (
            <div className="space-y-4">
              {sizes.map((size) => (
                <div
                  key={size.id}
                  className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 hover:border-slate-800 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-bold uppercase text-slate-500">{size.category_name}</span>
                      <ChevronRight className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-black text-slate-200">{size.size_name}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xxs font-semibold">
                      <span className="bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded">
                        {t('orders.weight')}: {parseFloat(size.min_weight)}kg → {parseFloat(size.max_weight)}kg
                      </span>
                      <span className="bg-slate-950 border border-slate-900 text-slate-400 px-2 py-0.5 rounded">
                        {t('sizes.allowed_vehicle_label')}{' '}
                        {size.allowed_vehicle_type === 'both'
                          ? t('sizes.vehicle_both')
                          : size.allowed_vehicle_type === 'motorcycle'
                          ? t('sizes.vehicle_motorcycle')
                          : t('sizes.vehicle_car')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(size)}
                        className="rounded-xl border border-slate-850 p-2 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title={t('common.edit')}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingSize(size);
                          setModalError('');
                        }}
                        className="rounded-xl border border-slate-850 p-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-880 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setDeletingSize(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4 mt-2">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-100">{t('sizes.delete_confirm')}</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-[280px] mx-auto">
                  {t('sizes.delete_confirm_sub')}
                </p>
                <div className="pt-2 text-sm font-black text-emerald-400 bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-900 inline-block">
                  {deletingSize.category_name} &rarr; {deletingSize.size_name}
                </div>
              </div>

              {modalError && (
                <div className="w-full flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-start text-xs font-semibold text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="w-full grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setDeletingSize(null)}
                  disabled={deleting}
                  className="rounded-2xl border border-slate-800 py-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteSize}
                  disabled={deleting}
                  className="rounded-2xl bg-rose-600 py-3 text-xs font-bold text-white hover:bg-rose-500 transition cursor-pointer shadow-md shadow-rose-600/15 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    t('common.delete')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
