'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  Coins, 
  Plus, 
  Settings, 
  AlertCircle,
  Clock,
  Trash2,
  X,
  MapPin,
  TrendingUp,
  Filter,
  ArrowRight
} from 'lucide-react';

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

interface PackageSize {
  id: number;
  size_name: string;
  category_name: string;
}

interface RoutePrice {
  id: number;
  from_city_id: number;
  from_city_name_ar: string;
  from_city_name_en: string;
  to_city_id: number;
  to_city_name_ar: string;
  to_city_name_en: string;
  package_size_id: number;
  package_size_name: string;
  category_name: string;
  price: string;
  is_local_delivery: boolean;
  is_distance_based: boolean;
  price_per_km: string;
  created_at: string;
}

export default function RoutePricesManagement() {
  const t = useTranslations();
  const [routePrices, setRoutePrices] = useState<RoutePrice[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [packageSizes, setPackageSizes] = useState<PackageSize[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterFromCityId, setFilterFromCityId] = useState('all');
  const [filterToCityId, setFilterToCityId] = useState('all');
  const [filterSizeId, setFilterSizeId] = useState('all');

  // Form State
  const [fromCityId, setFromCityId] = useState('');
  const [toCityId, setToCityId] = useState('');
  const [packageSizeId, setPackageSizeId] = useState('');
  const [price, setPrice] = useState('');
  const [isLocalDelivery, setIsLocalDelivery] = useState(false);
  const [isDistanceBased, setIsDistanceBased] = useState(false);
  const [pricePerKm, setPricePerKm] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete State
  const [deletingRoute, setDeletingRoute] = useState<RoutePrice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load all dependencies
  const loadData = async () => {
    try {
      setLoading(true);
      const [citiesRes, sizesRes, routesRes] = await Promise.all([
        api.get('/cities'),
        api.get('/admin/category-sizes'),
        api.get('/route-prices')
      ]);
      setCities(citiesRes.data.filter((c: any) => c.is_active));
      setPackageSizes(sizesRes.data);
      setRoutePrices(routesRes.data);
    } catch (e) {
      console.error('Failed to load data for route prices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync isLocalDelivery automatically if fromCityId and toCityId are equal
  useEffect(() => {
    if (fromCityId && toCityId && fromCityId === toCityId) {
      setIsLocalDelivery(true);
      setIsDistanceBased(true);
    } else if (fromCityId && toCityId && fromCityId !== toCityId) {
      setIsLocalDelivery(false);
      setIsDistanceBased(false);
    }
  }, [fromCityId, toCityId]);

  // Keep isDistanceBased in sync with isLocalDelivery
  useEffect(() => {
    setIsDistanceBased(isLocalDelivery);
  }, [isLocalDelivery]);

  const handleEditClick = (rp: RoutePrice) => {
    setEditingId(rp.id);
    setFromCityId(rp.from_city_id.toString());
    setToCityId(rp.to_city_id.toString());
    setPackageSizeId(rp.package_size_id.toString());
    setPrice(parseFloat(rp.price).toString());
    setIsLocalDelivery(rp.is_local_delivery);
    setIsDistanceBased(rp.is_distance_based || false);
    setPricePerKm(rp.price_per_km ? parseFloat(rp.price_per_km).toString() : '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearForm = () => {
    setEditingId(null);
    setFromCityId('');
    setToCityId('');
    setPackageSizeId('');
    setPrice('');
    setIsLocalDelivery(false);
    setIsDistanceBased(false);
    setPricePerKm('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCityId || !toCityId || !packageSizeId || (!isDistanceBased && !price) || (isDistanceBased && !pricePerKm)) {
      setError('يرجى تعبئة جميع الحقول المطلوبة.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        fromCityId: parseInt(fromCityId),
        toCityId: parseInt(toCityId),
        packageSizeId: parseInt(packageSizeId),
        price: isDistanceBased ? 0.00 : parseFloat(price),
        isLocalDelivery,
        isDistanceBased,
        pricePerKm: isDistanceBased ? parseFloat(pricePerKm) : 0.00
      };

      if (editingId) {
        await api.put(`/route-prices/${editingId}`, payload);
      } else {
        await api.post('/route-prices', payload);
      }

      handleClearForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || t('route_prices.save_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (rp: RoutePrice) => {
    setDeletingRoute(rp);
    setModalError('');
  };

  const confirmDelete = async () => {
    if (!deletingRoute) return;
    try {
      setDeleting(true);
      setModalError('');
      await api.delete(`/route-prices/${deletingRoute.id}`);
      setDeletingRoute(null);
      await loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.error || t('route_prices.delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  // Filtered route pricing rules list
  const filteredRoutePrices = routePrices.filter((rp) => {
    if (filterFromCityId !== 'all' && rp.from_city_id.toString() !== filterFromCityId) return false;
    if (filterToCityId !== 'all' && rp.to_city_id.toString() !== filterToCityId) return false;
    if (filterSizeId !== 'all' && rp.package_size_id.toString() !== filterSizeId) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          {t('route_prices.title')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          تهيئة وإعداد مصفوفة أسعار التوصيل الثابتة للمسارات بين المدن أو التوصيل الداخلي بناءً على حجم الطرد المحدد.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Panel */}
        <div className="xl:col-span-4 rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Coins className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              {editingId ? t('route_prices.edit_title') : t('route_prices.add')}
            </h3>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Origin City */}
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 block uppercase">
                {t('route_prices.from_city')}
              </label>
              <select
                required
                value={fromCityId}
                onChange={(e) => setFromCityId(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="">اختر مدينة الإرسال</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination City */}
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 block uppercase">
                {t('route_prices.to_city')}
              </label>
              <select
                required
                value={toCityId}
                onChange={(e) => setToCityId(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="">اختر مدينة الاستلام</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Package Size Select */}
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 block uppercase">
                {t('route_prices.package_size')}
              </label>
              <select
                required
                value={packageSizeId}
                onChange={(e) => setPackageSizeId(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
              >
                <option value="">اختر حجم الطرد</option>
                {packageSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.size_name} ({size.category_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Flat Price (YER) or Price per KM (YER) */}
            {isDistanceBased ? (
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-400 block uppercase">
                  {t('route_prices.price_per_km')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 pr-4 pl-12 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xxs font-bold text-slate-500">
                    ريال / كم
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-400 block uppercase">
                  {t('route_prices.price')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 pr-4 pl-12 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xxs font-bold text-slate-500">
                    ريال
                  </span>
                </div>
              </div>
            )}

            {/* Local Delivery Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-900 bg-slate-950/40">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-300 block">{t('route_prices.is_local')}</span>
                <span className="text-xxs text-slate-500">فعّل هذا الخيار إذا كان التوصيل داخل نفس المدينة</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLocalDelivery(!isLocalDelivery)}
                className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 flex items-center cursor-pointer ${
                  isLocalDelivery ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-slate-950 shadow-md block" />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 justify-end pt-3">
              {editingId && (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-900 transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
              >
                {submitting ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Listing Table & Multi Filters */}
        <div className="xl:col-span-8 rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">قواعد تسعير المسارات</h3>
            <span className="text-xxs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold">
              {filteredRoutePrices.length} عدد النتائج
            </span>
          </div>

          {/* Multi-Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-900">
            {/* Origin Filter */}
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 block uppercase">
                {t('route_prices.filter_from')}
              </span>
              <select
                value={filterFromCityId}
                onChange={(e) => setFilterFromCityId(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer py-1"
              >
                <option value="all">كل مدن الإرسال</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Filter */}
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 block uppercase">
                {t('route_prices.filter_to')}
              </span>
              <select
                value={filterToCityId}
                onChange={(e) => setFilterToCityId(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer py-1"
              >
                <option value="all">كل مدن الاستلام</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Filter */}
            <div className="space-y-1">
              <span className="text-xxs font-bold text-slate-500 block uppercase">
                {t('route_prices.filter_size')}
              </span>
              <select
                value={filterSizeId}
                onChange={(e) => setFilterSizeId(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-350 focus:outline-none cursor-pointer py-1"
              >
                <option value="all">{t('route_prices.all_sizes')}</option>
                {packageSizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.size_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : filteredRoutePrices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-650">
              {t('route_prices.no_routes')}
            </div>
          ) : (
            <div className="border border-slate-900 bg-slate-950/40 rounded-2xl overflow-hidden">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-xxs font-bold text-slate-400 uppercase bg-slate-950">
                    <th className="px-5 py-4 text-right">المسار</th>
                    <th className="px-5 py-4 text-right">فئة الحجم</th>
                    <th className="px-5 py-4 text-right">نوع التوصيل</th>
                    <th className="px-5 py-4 text-left">السعر</th>
                    <th className="px-5 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredRoutePrices.map((rp) => (
                    <tr 
                      key={rp.id}
                      className={`hover:bg-slate-900/10 text-xs transition ${
                        editingId === rp.id ? 'bg-emerald-500/5 hover:bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-bold text-slate-200">
                        <div className="flex items-center gap-2 text-sm font-black">
                          <span>{rp.from_city_name_ar}</span>
                          <span className="text-emerald-400 font-medium font-mono text-xs">➔</span>
                          <span>{rp.to_city_name_ar}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-300 block">{rp.package_size_name}</span>
                        <span className="text-xxs text-slate-500">{rp.category_name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-xxs px-2 py-0.5 rounded-full font-bold border ${
                          rp.is_local_delivery 
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {rp.is_local_delivery ? 'توصيل داخلي' : 'توصيل خارجي'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-left font-extrabold text-emerald-400">
                        {rp.is_distance_based 
                          ? `${parseFloat(rp.price_per_km || '0').toLocaleString('en-US')} ريال / كم`
                          : `${parseInt(rp.price).toLocaleString('en-US')} ريال`}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(rp)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                            title={t('common.edit')}
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rp)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
      {deletingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">{t('route_prices.delete_confirm')}</h3>
                <p className="text-xs text-slate-400">{t('route_prices.delete_confirm_sub')}</p>
              </div>
            </div>

            {modalError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 justify-end pt-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingRoute(null)}
                className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded-2xl bg-rose-500 hover:bg-rose-400 px-6 py-3 text-xs font-bold text-slate-950 transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? t('common.loading') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
