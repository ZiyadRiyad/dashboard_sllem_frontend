'use client';

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocale } from 'next-intl';
import { 
  Play, 
  Pause, 
  Settings, 
  MapPin, 
  AlertTriangle, 
  RefreshCw, 
  History, 
  Users, 
  Sliders, 
  Radio, 
  CheckCircle2, 
  Compass
} from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
  status: string;
  vehicle_type: string;
  active_orders_count: number;
}

interface TrackingLog {
  id: number;
  driver_id: string;
  driver_name: string;
  latitude: string;
  longitude: string;
  source: 'real' | 'fake' | 'manual_override';
  created_at: string;
}

export default function TrackingSettingsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // State Management
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(60);
  const [simulationEnabled, setSimulationEnabled] = useState(false);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  
  const [simLat, setSimLat] = useState('15.369400');
  const [simLng, setSimLng] = useState('44.191000');
  
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showConfirmAllModal, setShowConfirmAllModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Leaflet Map Refs
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const simMarkerRef = useRef<any>(null);

  // 1. Dynamic Injection of Leaflet Resources on Mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // API Call Helpers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('sllem_admin_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/settings/gps`, getAuthHeaders());
      setGpsEnabled(res.data.gpsTrackingEnabled);
      setUpdateInterval(res.data.gpsUpdateInterval);
      setSimulationEnabled(res.data.gpsSimulationEnabled);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/gps/drivers`, getAuthHeaders());
      setDrivers(res.data);
      if (res.data.length > 0 && !selectedDriverId) {
        setSelectedDriverId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/gps/logs`, getAuthHeaders());
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load Initials
  useEffect(() => {
    fetchSettings();
    fetchDrivers();
    fetchLogs();
    
    // Auto-refresh drivers & logs every 8 seconds
    const interval = setInterval(() => {
      fetchDrivers();
      fetchLogs();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Map Initialization and Update
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = (window as any).L;

    if (!mapRef.current) {
      mapRef.current = L.map('admin-gps-map').setView([15.3694, 44.1910], 12);
      
      // Modern slate dark map tiles styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
      }).addTo(mapRef.current);

      // Handle map clicks to set simulation coordinates
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setSimLat(lat.toFixed(6));
        setSimLng(lng.toFixed(6));

        if (simMarkerRef.current) {
          simMarkerRef.current.setLatLng(e.latlng);
        } else {
          // Purple pulsing simulation pin
          const simIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-6 h-6 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse"><span class="w-2 h-2 bg-white rounded-full"></span></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          simMarkerRef.current = L.marker(e.latlng, { icon: simIcon, draggable: true }).addTo(mapRef.current);
          
          simMarkerRef.current.on('dragend', (de: any) => {
            const pos = de.target.getLatLng();
            setSimLat(pos.lat.toFixed(6));
            setSimLng(pos.lng.toFixed(6));
          });
        }
      });
    }

    // Refresh Active Driver Markers
    // 1. Remove markers of drivers that are no longer present
    const activeIds = drivers.map(d => d.id);
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.includes(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // 2. Add/Update markers for present drivers
    drivers.forEach(d => {
      if (d.latitude && d.longitude) {
        const isOnline = new Date().getTime() - new Date(d.updated_at).getTime() < 120000; // Active within 2 mins
        const lat = parseFloat(d.latitude as any);
        const lng = parseFloat(d.longitude as any);

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex flex-col items-center">
            <div class="px-2 py-0.5 bg-slate-900 border border-slate-700 text-xxs font-bold rounded shadow-md truncate max-w-[80px] text-slate-300 mb-1">${d.full_name.split(' ')[0]}</div>
            <div class="w-6 h-6 ${isOnline ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-slate-500 shadow-slate-500/20'} rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg animate-fade">
              <svg class="w-3.5 h-3.5 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
            </div>
          </div>`,
          iconSize: [80, 50],
          iconAnchor: [40, 45]
        });

        if (markersRef.current[d.id]) {
          markersRef.current[d.id].setLatLng([lat, lng]);
        } else {
          markersRef.current[d.id] = L.marker([lat, lng], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(`
              <div class="text-slate-950 font-bold p-1">
                <p class="font-black text-sm">${d.full_name}</p>
                <p class="text-xs text-slate-500">${d.phone_number}</p>
                <div class="mt-1 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
                  <span class="text-xxs">${isOnline ? 'Online / متصل' : 'Offline / غير متصل'}</span>
                </div>
              </div>
            `);
        }
      }
    });

  }, [leafletLoaded, drivers]);

  // Handle updates to master toggle / intervals
  const handleSaveSettings = async (enabled: boolean, interval: number, sim: boolean) => {
    try {
      setLoadingSettings(true);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/settings/gps`,
        { 
          gpsTrackingEnabled: enabled, 
          gpsUpdateInterval: interval, 
          gpsSimulationEnabled: sim 
        },
        getAuthHeaders()
      );
      setGpsEnabled(enabled);
      setUpdateInterval(interval);
      setSimulationEnabled(sim);
      triggerAlert(isRtl ? 'تم حفظ التحديثات وإرسالها لجميع السائقين بنجاح' : 'Settings saved and pushed to all active drivers successfully.');
    } catch (e) {
      setErrorMessage(isRtl ? 'فشل حفظ الإعدادات' : 'Failed to save settings.');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Trigger Simulation overrides
  const handleSimulate = async (targetId: string) => {
    if (!simLat || !simLng) return;
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/gps/simulate`,
        {
          driverId: targetId,
          latitude: parseFloat(simLat),
          longitude: parseFloat(simLng)
        },
        getAuthHeaders()
      );
      triggerAlert(res.data.message);
      fetchDrivers();
      fetchLogs();
    } catch (e) {
      setErrorMessage(isRtl ? 'فشل إرسال الإحداثيات الوهمية' : 'Failed to apply coordinates override.');
    } finally {
      setActionLoading(false);
    }
  };

  const triggerAlert = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shadow-xl shadow-emerald-500/5 animate-slide-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl shadow-xl shadow-rose-500/5 animate-slide-in">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Main Grid controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Master Controls */}
        <div className="lg:col-span-1 border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-emerald-400" />
              <span>{isRtl ? 'التحكم العام بالبث المباشر' : 'Global Tracking Settings'}</span>
            </h3>
            {loadingSettings && <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />}
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            {isRtl 
              ? 'تتحكم هذه الإعدادات بشكل مباشر في تردد بث إحداثيات الـ GPS ونشاط التطبيقات للهواتف المحمولة.'
              : 'Configure parameters that dictate GPS intervals and status synchronizations globally.'}
          </p>

          <hr className="border-slate-900" />

          {/* Master GPS Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-2xl border border-slate-900/60">
            <div>
              <p className="text-sm font-bold">{isRtl ? 'تمكين التتبع الحي' : 'Enable Live GPS Tracking'}</p>
              <p className="text-slate-500 text-xxs mt-0.5">
                {isRtl ? 'تعطيل هذا الخيار يوقف التتبع بالكامل لتوفير الطاقة' : 'Disabling this shuts off all background syncs'}
              </p>
            </div>
            <button
              onClick={() => handleSaveSettings(!gpsEnabled, updateInterval, simulationEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                gpsEnabled ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                gpsEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Dynamic interval selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block">{isRtl ? 'تردد تحديث الإحداثيات (ثواني)' : 'Location Sync Frequency (Seconds)'}</label>
            <select
              value={updateInterval}
              onChange={(e) => handleSaveSettings(gpsEnabled, parseInt(e.target.value, 10), simulationEnabled)}
              className="w-full bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-2xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all duration-300"
            >
              <option value="5">5 {isRtl ? 'ثواني (اختبار مكثف)' : 'Seconds (Intense)'}</option>
              <option value="10">10 {isRtl ? 'ثواني' : 'Seconds'}</option>
              <option value="15">15 {isRtl ? 'ثانية' : 'Seconds'}</option>
              <option value="30">30 {isRtl ? 'ثانية' : 'Seconds'}</option>
              <option value="60">60 {isRtl ? 'ثانية (افتراضي)' : 'Seconds (Default)'}</option>
            </select>
          </div>

          {/* Master Simulation Switch */}
          <div className="flex items-center justify-between p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
            <div>
              <p className="text-sm font-bold text-purple-400">{isRtl ? 'تفعيل محاكاة الـ GPS' : 'Enable Mock GPS Simulation'}</p>
              <p className="text-slate-500 text-xxs mt-0.5">
                {isRtl ? 'لتشغيل التتبع بالكمبيوتر وتجاهل هواتف السائقين' : 'Overrides real phone coordinates with admin mocks'}
              </p>
            </div>
            <button
              onClick={() => handleSaveSettings(gpsEnabled, updateInterval, !simulationEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                simulationEnabled ? 'bg-purple-500' : 'bg-slate-800'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                simulationEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
              }`} />
            </button>
          </div>

        </div>

        {/* Panel 2: Simulator Panel */}
        <div className="lg:col-span-2 border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-black flex items-center gap-2.5 text-purple-400">
              <Compass className="h-5 w-5 text-purple-400" />
              <span>{isRtl ? 'أدوات محاكاة إحداثيات السائقين' : 'Driver GPS Simulation Panel'}</span>
            </h3>
            
            {!simulationEnabled && (
              <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xxs font-semibold leading-relaxed">
                  {isRtl 
                    ? 'تنبيه: نمط المحاكاة غير مفعل حالياً. قم بتشغيل المفتاح أعلاه لبدء بث الإحداثيات الوهمية للعملاء.'
                    : 'Simulation mode is currently disabled. Toggle the switch to apply simulated movements.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block">{isRtl ? 'اختر السائق' : 'Select Target Driver'}</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-2xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-500 transition-all duration-300"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.phone_number})</option>
                  ))}
                  {drivers.length === 0 && <option value="">{isRtl ? 'لا يوجد سائقين حالياً' : 'No drivers registered'}</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 block">{isRtl ? 'خط العرض (Lat)' : 'Latitude (Lat)'}</label>
                  <input
                    type="text"
                    value={simLat}
                    onChange={(e) => setSimLat(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-2xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-500 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 block">{isRtl ? 'خط الطول (Lng)' : 'Longitude (Lng)'}</label>
                  <input
                    type="text"
                    value={simLng}
                    onChange={(e) => setSimLng(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-2xl text-slate-200 text-sm font-semibold focus:outline-none focus:border-purple-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <p className="text-xxs text-slate-500">
              💡 {isRtl 
                ? 'نصيحة: يمكنك النقر فوق أي مكان في خريطة المعاينة المباشرة لتعبئة الإحداثيات فورياً بدقة تامة.' 
                : 'Pro Tip: Simply click anywhere on the live preview map to auto-fill exact coordinates.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-900">
            <button
              onClick={() => handleSimulate(selectedDriverId)}
              disabled={actionLoading || drivers.length === 0}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 disabled:opacity-40 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <Compass className="h-4 w-4 animate-pulse" />
              <span>{isRtl ? 'تطبيق الموقع الوهمي للكابتن المختار' : 'Apply Mock Location to Driver'}</span>
            </button>

            <button
              onClick={() => setShowConfirmAllModal(true)}
              disabled={actionLoading || drivers.length === 0}
              className="py-3 px-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold text-xs disabled:opacity-40 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>{isRtl ? 'تطبيق الموقع على جميع السائقين' : 'Apply to All Drivers'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Map Live Preview */}
      <div className="border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black flex items-center gap-2.5 text-cyan-400">
            <Radio className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span>{isRtl ? 'خريطة البث المباشر ومعاينة سائقين المنصة' : 'Active Drivers Live Map Preview'}</span>
          </h3>
          <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-slate-900 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            {drivers.filter(d => d.latitude && d.longitude).length} {isRtl ? 'سائق متاح' : 'Drivers Active'}
          </span>
        </div>

        <div 
          id="admin-gps-map" 
          className="h-[420px] w-full rounded-2xl border border-slate-900 shadow-inner overflow-hidden" 
          style={{ zIndex: 1 }}
        />
      </div>

      {/* Logs and Details */}
      <div className="border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6 rounded-3xl shadow-xl space-y-6">
        <h3 className="text-base font-black flex items-center gap-2.5">
          <History className="h-5 w-5 text-slate-400" />
          <span>{isRtl ? 'سجل تتبع ومواقع السائقين الأخير' : 'Recent GPS Tracking Logs'}</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-900/30 text-xxs font-black text-slate-400 uppercase tracking-wider text-center">
                <th className="py-4 px-6">{isRtl ? 'اسم السائق' : 'Driver Name'}</th>
                <th className="py-4 px-6">{isRtl ? 'إحداثيات خط العرض (Lat)' : 'Latitude'}</th>
                <th className="py-4 px-6">{isRtl ? 'إحداثيات خط الطول (Lng)' : 'Longitude'}</th>
                <th className="py-4 px-6">{isRtl ? 'تاريخ التحديث' : 'Timestamp'}</th>
                <th className="py-4 px-6">{isRtl ? 'مصدر الإحداثي' : 'Log Source'}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 transition-all duration-200 text-xs font-semibold text-center">
                  <td className="py-3.5 px-6 font-black text-slate-200">{log.driver_name}</td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono">{parseFloat(log.latitude).toFixed(6)}</td>
                  <td className="py-3.5 px-6 text-slate-400 font-mono">{parseFloat(log.longitude).toFixed(6)}</td>
                  <td className="py-3.5 px-6 text-slate-500 font-medium">
                    {new Date(log.created_at).toLocaleTimeString('en-US')}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold inline-block ${
                      log.source === 'real'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : log.source === 'fake'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.source === 'real' ? (isRtl ? 'حقيقي GPS' : 'Real GPS') : 
                       log.source === 'fake' ? (isRtl ? 'محاكاة وهمية' : 'Mock GPS') : 
                       (isRtl ? 'تجاوز جماعي' : 'Manual Override')}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-bold text-xs">
                    {isRtl ? 'لا توجد سجلات تتبع حالياً.' : 'No GPS logs registered yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-slate-900 bg-slate-900 p-6 rounded-3xl shadow-2xl space-y-6 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 animate-bounce" />
              <h4 className="text-base font-black">{isRtl ? 'تنبيه: تجاوز إحداثيات جميع السائقين' : 'Dangerous Operation Confirmation'}</h4>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {isRtl 
                ? 'هل أنت متأكد من رغبتك في تطبيق الموقع الوهمي الحالي على كافة سائقين المنصة النشطين دفعة واحدة؟ هذا الإجراء سيغير مواقعهم الجغرافية فوراً ويغير خطوط تتبع عملائهم.'
                : 'Are you sure you want to apply the current mock coordinates globally to all drivers? This changes the live position of all active drivers immediately.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmAllModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 text-xs font-bold transition-all cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmAllModal(false);
                  handleSimulate('all');
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                {isRtl ? 'نعم، قم بالتطبيق' : 'Yes, Override All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
