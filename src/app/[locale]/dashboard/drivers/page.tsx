'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  Truck, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  UserX,
  UserCheck,
  Pause,
  RefreshCw,
  Trash2,
  Eye,
  Info,
  Calendar,
  MapPin,
  User
} from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  user_status: string;
  created_at: string;
  address_text: string | null;
  city_name_ar: string | null;
  city_name_en: string | null;
  legacy_vehicle_type: string;
  license_number: string;
  driver_status: string;
  documents: any;
  approved_at: string | null;
  approval_status: string;
  rejected_at: string | null;
  rejection_reason: string | null;
  vehicle_id: string | null;
  vehicle_type: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  plate_number: string | null;
  vehicle_photo: string | null;
  license_photo: string | null;
  vehicle_verification_status: string | null;
}

export default function DriversManagement() {
  const t = useTranslations();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('ALL');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  
  // Rejection modal state
  const [rejectingDriverId, setRejectingDriverId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/drivers');
      setDrivers(res.data);
    } catch (e) {
      console.error('Failed to fetch drivers list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleApprove = async (driverId: string) => {
    if (!window.confirm('هل أنت متأكد من الموافقة على هذا السائق؟')) return;
    try {
      await api.patch(`/admin/drivers/${driverId}/status`, { status: 'approved' });
      fetchDrivers();
    } catch (e) {
      console.error('Failed to approve driver:', e);
    }
  };

  const handleSuspend = async (driverId: string) => {
    if (!window.confirm('هل أنت متأكد من تعليق حساب هذا السائق؟')) return;
    try {
      await api.patch(`/admin/drivers/${driverId}/status`, { status: 'suspended' });
      fetchDrivers();
    } catch (e) {
      console.error('Failed to suspend driver:', e);
    }
  };

  const handleBlockUser = async (driverId: string) => {
    if (!window.confirm('هل أنت متأكد من حظر حساب هذا المستخدم بالكامل؟')) return;
    try {
      await api.patch(`/admin/drivers/${driverId}/status`, { status: 'blocked' });
      fetchDrivers();
    } catch (e) {
      console.error('Failed to block driver:', e);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm(t('common.confirm_delete') || 'هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.delete(`/admin/drivers/${id}`);
      fetchDrivers();
    } catch (e) {
      console.error('Failed to delete driver:', e);
      alert('خطأ أثناء حذف السائق.');
    }
  };

  const submitRejection = async () => {
    if (!rejectingDriverId) return;
    try {
      await api.patch(`/admin/drivers/${rejectingDriverId}/status`, { 
        status: 'rejected',
        rejectionReason: rejectionReasonInput || 'لم يستوف الشروط المطلوبة للتسجيل'
      });
      setRejectingDriverId(null);
      setRejectionReasonInput('');
      fetchDrivers();
    } catch (e) {
      console.error('Failed to reject driver:', e);
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'PENDING_APPROVAL':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'SUSPENDED':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getApprovalLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'مقبول / Approved';
      case 'REJECTED':
        return 'مرفوض / Rejected';
      case 'PENDING_APPROVAL':
        return 'قيد المراجعة / Pending';
      case 'SUSPENDED':
        return 'معلق / Suspended';
      default:
        return status;
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const status = d.approval_status || 'PENDING_APPROVAL';
    if (activeTab === 'ALL') return true;
    return status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-100">{t('drivers.title')}</h2>
        </div>
        <button 
          onClick={fetchDrivers}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="تحديث البيانات"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-1">
        {[
          { key: 'ALL', label: 'الكل' },
          { key: 'PENDING_APPROVAL', label: 'قيد المراجعة' },
          { key: 'APPROVED', label: 'مقبول' },
          { key: 'REJECTED', label: 'مرفوض' },
          { key: 'SUSPENDED', label: 'معلق' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                 : 'bg-slate-900/40 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">{t('common.loading')}</span>
          </div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-slate-900 rounded-3xl bg-slate-900/10 backdrop-blur-md">
          <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
          <span className="text-sm text-slate-500 font-medium">لا يوجد سائقين في هذا القسم.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDrivers.map((driver) => {
            const status = driver.approval_status || 'PENDING_APPROVAL';
            return (
              <div
                key={driver.id}
                className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/10 p-6 shadow-xl backdrop-blur-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-900 pb-4 mb-4 gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 leading-tight">{driver.full_name}</h3>
                    <p className="text-xxs text-slate-500 font-medium mt-1">{driver.phone_number}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase ${getApprovalBadge(status)}`}>
                    {getApprovalLabel(status)}
                  </span>
                </div>

                {/* Specs */}
                <div className="space-y-3 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>{t('drivers.vehicle')}:</span>
                    <span className="font-bold text-slate-200">
                      {driver.vehicle_type === 'bike' ? 'دراجة نارية / Bike' :
                       driver.vehicle_type === 'car' ? 'سيارة / Car' :
                       driver.vehicle_type === 'tuk_tuk' ? 'تكتك / Tuk Tuk' :
                       driver.vehicle_type === 'van' ? 'شاحنة صغيرة / Van' : 
                       (driver.legacy_vehicle_type === 'motorcycle' ? t('drivers.motorcycle') : t('drivers.car'))}
                    </span>
                  </div>
                  {driver.brand && (
                    <div className="flex items-center justify-between">
                      <span>الماركة والموديل:</span>
                      <span className="font-bold text-slate-200">{driver.brand} {driver.model}</span>
                    </div>
                  )}
                  {driver.plate_number && (
                    <div className="flex items-center justify-between">
                      <span>رقم اللوحة واللون:</span>
                      <span className="font-bold text-slate-200">{driver.plate_number} ({driver.color})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>حالة الحساب العامة:</span>
                    <span className={`font-bold ${driver.user_status === 'blocked' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {driver.user_status === 'blocked' ? 'محظور' : 'نشط'}
                    </span>
                  </div>
                  {driver.approved_at && (
                    <div className="flex items-center justify-between">
                      <span>تاريخ الموافقة:</span>
                      <span className="font-medium text-slate-500">
                        {new Date(driver.approved_at).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  )}
                  {status === 'REJECTED' && driver.rejection_reason && (
                    <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 mt-2 text-xxs text-rose-300">
                      <span className="font-bold block mb-1">سبب الرفض:</span>
                      {driver.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-slate-900/60 flex flex-wrap items-center justify-end gap-2">
                  {/* View Details Action */}
                  <button
                    onClick={() => setSelectedDriver(driver)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 px-3 py-2 text-xxs font-bold text-slate-300 transition-all cursor-pointer animate-hover"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>تفاصيل الملف</span>
                  </button>

                  {/* Approve Action */}
                  {status !== 'APPROVED' && (
                    <button
                      onClick={() => handleApprove(driver.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-xxs font-bold text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/10 animate-hover"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>موافقة</span>
                    </button>
                  )}

                  {/* Reject Action */}
                  {status !== 'REJECTED' && (
                    <button
                      onClick={() => setRejectingDriverId(driver.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-2 text-xxs font-bold text-rose-400 transition-all cursor-pointer animate-hover"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>رفض الطلب</span>
                    </button>
                  )}

                  {/* Suspend Action */}
                  {status === 'APPROVED' && (
                    <button
                      onClick={() => handleSuspend(driver.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 px-3 py-2 text-xxs font-bold text-purple-400 transition-all cursor-pointer animate-hover"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      <span>تعليق الحساب</span>
                    </button>
                  )}

                  {/* Block / Unblock General Account Action */}
                  {driver.user_status !== 'blocked' ? (
                    <button
                      onClick={() => handleBlockUser(driver.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 px-3 py-2 text-xxs font-bold text-slate-400 transition-all cursor-pointer animate-hover"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>حظر الحساب</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(driver.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-2 text-xxs font-bold text-emerald-400 transition-all cursor-pointer animate-hover"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>فك الحظر</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteDriver(driver.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-600/30 bg-rose-950/20 hover:bg-rose-900/40 px-3 py-2 text-xxs font-bold text-rose-500 transition-all cursor-pointer animate-hover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t('common.delete_permanently') || 'حذف نهائي'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingDriverId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">تحديد سبب الرفض</h3>
            <p className="text-xs text-slate-400">يرجى كتابة سبب رفض طلب انضمام السائق ليتم عرضه له في التطبيق.</p>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="مثال: صورة رخصة القيادة غير واضحة..."
              className="w-full h-24 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingDriverId(null);
                  setRejectionReasonInput('');
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={submitRejection}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-slate-950 transition-colors"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Truck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{selectedDriver.full_name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">سجل تفاصيل السائق والمركبة</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDriver(null)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
              {/* Left Column: Details */}
              <div className="space-y-6">
                {/* Personal Info Card */}
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900/80 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 border-b border-slate-900 pb-2">البيانات الشخصية</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">الاسم الكامل:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.full_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">رقم الهاتف:</span>
                      <span className="text-slate-200 font-bold leading-none">{selectedDriver.phone_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">المدينة:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.city_name_ar || 'غير محدد'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">العنوان:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.address_text || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info Card */}
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900/80 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 border-b border-slate-900 pb-2">بيانات المركبة</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">نوع المركبة:</span>
                      <span className="text-slate-200 font-bold">
                        {selectedDriver.vehicle_type === 'bike' ? 'دراجة نارية / Bike' :
                         selectedDriver.vehicle_type === 'car' ? 'سيارة / Car' :
                         selectedDriver.vehicle_type === 'tuk_tuk' ? 'تكتك / Tuk Tuk' :
                         selectedDriver.vehicle_type === 'van' ? 'شاحنة صغيرة / Van' : 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">الماركة والنوع:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.brand} {selectedDriver.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">اللون:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.color}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">رقم اللوحة:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.plate_number}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">رقم الرخصة:</span>
                      <span className="text-slate-200 font-bold">{selectedDriver.license_number}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Media Documents */}
              <div className="space-y-6">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900/80 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-400 border-b border-slate-900 pb-2">المستندات والصور المرفوعة</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vehicle Photo Container */}
                    <div className="space-y-2">
                      <span className="text-xxs text-slate-400 block font-bold">صورة المركبة:</span>
                      {selectedDriver.vehicle_photo ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center">
                          <img 
                            src={`http://localhost:5000${selectedDriver.vehicle_photo}`} 
                            alt="صورة المركبة" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <a 
                            href={`http://localhost:5000${selectedDriver.vehicle_photo}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xxs font-bold text-slate-100"
                          >
                            عرض الصورة بحجم كامل
                          </a>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 aspect-[4/3] flex flex-col items-center justify-center text-slate-600 bg-slate-900/10">
                          <span className="text-xxs">لا توجد صورة</span>
                        </div>
                      )}
                    </div>

                    {/* License Photo Container */}
                    <div className="space-y-2">
                      <span className="text-xxs text-slate-400 block font-bold">صورة رخصة القيادة:</span>
                      {selectedDriver.license_photo ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center">
                          <img 
                            src={`http://localhost:5000${selectedDriver.license_photo}`} 
                            alt="صورة الرخصة" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <a 
                            href={`http://localhost:5000${selectedDriver.license_photo}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xxs font-bold text-slate-100"
                          >
                            عرض الصورة بحجم كامل
                          </a>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 aspect-[4/3] flex flex-col items-center justify-center text-slate-600 bg-slate-900/10">
                          <span className="text-xxs">لا توجد صورة</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="border-t border-slate-900 pt-6 flex flex-wrap items-center justify-end gap-3">
              {selectedDriver.approval_status !== 'APPROVED' && (
                <button
                  onClick={() => {
                    handleApprove(selectedDriver.id);
                    setSelectedDriver(null);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>موافقة وتفعيل الحساب</span>
                </button>
              )}

              {selectedDriver.approval_status !== 'REJECTED' && (
                <button
                  onClick={() => {
                    setRejectingDriverId(selectedDriver.id);
                    setSelectedDriver(null);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-5 py-2.5 text-xs font-bold text-rose-400 transition-all cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  <span>رفض الطلب</span>
                </button>
              )}

              {selectedDriver.user_status !== 'blocked' ? (
                <button
                  onClick={() => {
                    handleBlockUser(selectedDriver.id);
                    setSelectedDriver(null);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                >
                  <UserX className="h-4 w-4" />
                  <span>حظر السائق</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleApprove(selectedDriver.id);
                    setSelectedDriver(null);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-5 py-2.5 text-xs font-bold text-emerald-400 transition-all cursor-pointer"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>إلغاء حظر السائق</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleDeleteDriver(selectedDriver.id);
                  setSelectedDriver(null);
                }}
                className="flex items-center gap-2 rounded-xl border border-rose-600/30 bg-rose-950/20 hover:bg-rose-900/40 px-5 py-2.5 text-xs font-bold text-rose-500 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>حذف نهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
