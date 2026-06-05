'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  FolderPlus, 
  Plus, 
  Folder, 
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  created_at: string;
}

export default function CategoriesManagement() {
  const t = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit / Delete State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, { name: name.trim() });
        setEditingCategory(null);
      } else {
        await api.post('/admin/categories', { name: name.trim() });
      }
      setName('');
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || (editingCategory ? t('categories.update_failed') : t('categories.create_failed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    setModalError('');

    try {
      await api.delete(`/admin/categories/${deletingCategory.id}`);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.error || t('categories.delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <FolderPlus className="h-6 w-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">{t('categories.title')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create / Edit Form */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-md shadow-xl h-fit">
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-emerald-400" />
            <span>{editingCategory ? t('categories.edit_title') : t('categories.add')}</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold text-slate-400 block">
                {t('categories.name')}
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder={t('categories.placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-880 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="flex gap-3">
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 rounded-2xl border border-slate-800 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer transition"
                >
                  {t('common.cancel')}
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

        {/* Categories List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-md shadow-xl flex flex-col">
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Folder className="h-4.5 w-4.5 text-cyan-400" />
            <span>{t('categories.existing')}</span>
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
          ) : categories.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
              {t('categories.no_categories')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-start">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-xxs font-bold uppercase tracking-wider">
                    <th className="pb-3 text-start">{t('categories.id')}</th>
                    <th className="pb-3 text-start">{t('categories.name')}</th>
                    <th className="pb-3 text-start">{t('categories.configured_on')}</th>
                    <th className="pb-3 text-end">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {categories.map((category) => (
                    <tr key={category.id} className="text-slate-300 hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 font-semibold text-slate-500 text-xs text-start">{category.id}</td>
                      <td className="py-4 text-slate-200 font-bold text-xs text-start">{category.name}</td>
                      <td className="py-4 text-xs text-slate-500 text-start">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(category.created_at).toLocaleString('en-US')}</span>
                        </div>
                      </td>
                      <td className="py-4 text-xs text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(category)}
                            className="rounded-xl border border-slate-850 p-2 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                            title={t('common.edit')}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingCategory(category);
                              setModalError('');
                            }}
                            className="rounded-xl border border-slate-850 p-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-880 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setDeletingCategory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4 mt-2">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-100">{t('categories.delete_confirm')}</h4>
                <p className="text-xs text-slate-400 font-semibold max-w-[280px] mx-auto">
                  {t('categories.delete_confirm_sub')}
                </p>
                <div className="pt-2 text-sm font-black text-emerald-400 bg-slate-950/30 px-3 py-1 rounded-lg border border-slate-900 inline-block">
                  {deletingCategory.name}
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
                  onClick={() => setDeletingCategory(null)}
                  disabled={deleting}
                  className="rounded-2xl border border-slate-800 py-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
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
