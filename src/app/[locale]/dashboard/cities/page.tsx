'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  Map, 
  Plus, 
  Settings, 
  AlertCircle,
  Clock,
  Trash2,
  X,
  CheckCircle,
  MapPin
} from 'lucide-react';

interface City {
  id: number;
  name_ar: string;
  name_en: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  created_at: string;
}

export default function CitiesManagement() {
  const t = useTranslations();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [latitude, setLatitude] = useState('14.542488'); // Default to Mukalla
  const [longitude, setLongitude] = useState('49.124233');
  const [isActive, setIsActive] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);

  // Delete State
  const [deletingCity, setDeletingCity] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Map State
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 1. Fetch cities
  const loadCities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cities');
      setCities(res.data);
    } catch (e) {
      console.error('Failed to load cities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  // 2. Load Leaflet from CDN dynamically to avoid Next.js SSR mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.head.removeChild(link);
        document.body.removeChild(script);
      } catch (err) {
        // Safe check if elements were already unmounted
      }
    };
  }, []);

  // 3. Initialize/update Map
  useEffect(() => {
    if (!mapLoaded || !(window as any).L) return;

    const L = (window as any).L;
    const latVal = parseFloat(latitude) || 14.542488;
    const lngVal = parseFloat(longitude) || 49.124233;

    if (!mapRef.current) {
      // Create map instance
      mapRef.current = L.map('cities-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([latVal, lngVal], 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

      // Create marker with custom styling
      markerRef.current = L.marker([latVal, lngVal], { draggable: true }).addTo(mapRef.current);

      // Click event
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        markerRef.current.setLatLng(e.latlng);
      });

      // Drag event
      markerRef.current.on('dragend', () => {
        const latlng = markerRef.current.getLatLng();
        setLatitude(latlng.lat.toFixed(6));
        setLongitude(latlng.lng.toFixed(6));
      });
    } else {
      // Map already exists, update viewpoint & marker
      const currentLatLng = markerRef.current.getLatLng();
      if (Math.abs(currentLatLng.lat - latVal) > 0.0001 || Math.abs(currentLatLng.lng - lngVal) > 0.0001) {
        const newPos = [latVal, lngVal];
        mapRef.current.setView(newPos, mapRef.current.getZoom());
        markerRef.current.setLatLng(newPos);
      }
    }
  }, [mapLoaded, latitude, longitude]);

  const handleEditClick = (city: City) => {
    setEditingId(city.id);
    setNameAr(city.name_ar);
    setNameEn(city.name_en);
    setLatitude(parseFloat(city.latitude).toString());
    setLongitude(parseFloat(city.longitude).toString());
    setIsActive(city.is_active);
    
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearForm = () => {
    setEditingId(null);
    setNameAr('');
    setNameEn('');
    setLatitude('14.542488');
    setLongitude('49.124233');
    setIsActive(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !nameEn.trim() || !latitude || !longitude) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isActive
      };

      if (editingId) {
        await api.put(`/cities/${editingId}`, payload);
      } else {
        await api.post('/cities', payload);
      }

      handleClearForm();
      await loadCities();
    } catch (err: any) {
      setError(err.response?.data?.error || t('cities.save_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (city: City) => {
    setDeletingCity(city);
    setModalError('');
  };

  const confirmDelete = async () => {
    if (!deletingCity) return;
    try {
      setDeleting(true);
      setModalError('');
      await api.delete(`/cities/${deletingCity.id}`);
      setDeletingCity(null);
      await loadCities();
    } catch (err: any) {
      setModalError(err.response?.data?.error || t('cities.delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {t('cities.title')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage geographical service parameters, default map anchors, and regional toggles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Form panel & OSM Map Map */}
        <div className="xl:col-span-8 space-y-6">
          {/* OSM Map Container */}
          <div className="rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-4 overflow-hidden relative shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">{t('cities.map_instruction')}</span>
            </div>
            
            <div 
              id="cities-map" 
              className="w-full h-80 rounded-2xl border border-slate-900/60 bg-slate-950/80 overflow-hidden relative z-10"
              style={{ minHeight: '320px' }}
            >
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 bg-slate-950/60">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Loading interactive map...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CRUD Form card */}
          <div className="rounded-3xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Settings className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                {editingId ? t('cities.edit_title') : t('cities.add')}
              </h3>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Arabic Name */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block uppercase">
                    {t('cities.name_ar')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: المكلا"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* English Name */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block uppercase">
                    {t('cities.name_en')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Mukalla"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Latitude */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block uppercase">
                    {t('cities.latitude')}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    placeholder="14.542488"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Longitude */}
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-400 block uppercase">
                    {t('cities.longitude')}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    placeholder="49.124233"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Service Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-900 bg-slate-950/40">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-300 block">{t('cities.status')}</span>
                  <span className="text-xxs text-slate-500">Allow customers to select this city for deliveries.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 flex items-center cursor-pointer ${
                    isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
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
        </div>

        {/* Directory Listing Table */}
        <div className="xl:col-span-4 rounded-3xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Cities Directory</h3>
            <span className="text-xxs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold">
              {cities.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : cities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-600">
              {t('cities.no_cities')}
            </div>
          ) : (
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {cities.map((city) => (
                <div 
                  key={city.id}
                  className={`group p-4 rounded-2xl border transition-all duration-300 ${
                    editingId === city.id 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : 'border-slate-900 bg-slate-950/40 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-xs font-bold text-slate-200">{city.name_en}</h4>
                        <span className="text-xs font-medium text-slate-400">({city.name_ar})</span>
                      </div>
                      <p className="text-xxs text-slate-500 font-medium">
                        Coord: {parseFloat(city.latitude).toFixed(4)}, {parseFloat(city.longitude).toFixed(4)}
                      </p>
                      
                      {/* Active Status Badge */}
                      <span className={`inline-flex items-center gap-1 text-xxs px-2 py-0.5 rounded-full font-bold border mt-2 ${
                        city.is_active 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {city.is_active ? t('cities.is_active') : 'Inactive'}
                      </span>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(city)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                        title={t('common.edit')}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(city)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
      {deletingCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">{t('cities.delete_confirm')}</h3>
                <p className="text-xs text-slate-400">{t('cities.delete_confirm_sub')}</p>
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
                onClick={() => setDeletingCity(null)}
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
