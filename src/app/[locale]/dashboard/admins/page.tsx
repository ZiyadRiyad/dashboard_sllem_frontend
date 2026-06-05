'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import {
  ShieldAlert,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  AlertCircle,
  Calendar,
  X,
  Check,
  MapPin
} from 'lucide-react';

interface Admin {
  id: string;
  full_name: string;
  phone_number: string;
  status: string;
  created_at: string;
  city_id: number | null;
  city_name_ar: string | null;
  city_name_en: string | null;
}

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

export default function AdminsManagement() {
  const t = useTranslations();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [cityId, setCityId] = useState('');
  const [status, setStatus] = useState('active');

  const [isFetchingAdmins, setIsFetchingAdmins] = useState(false);
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  const fetchAdmins = async () => {
    if (isFetchingAdmins) return;
    try {
      setIsFetchingAdmins(true);
      setLoading(true);
      const res = await api.get('/admin/admins');
      setAdmins(res.data);
    } catch (e) {
      console.error('Failed to fetch admins:', e);
    } finally {
      setLoading(false);
      setIsFetchingAdmins(false);
    }
  };

  const fetchCities = async () => {
    if (isFetchingCities) return;
    try {
      setIsFetchingCities(true);
      const res = await api.get('/cities');
      setCitiesList(res.data);
      if (res.data.length > 0 && !cityId) {
        setCityId(res.data[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to fetch cities:', e);
    } finally {
      setIsFetchingCities(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCities();
  }, []);

  const handleOpenAddModal = () => {
    setFullName('');
    setPhoneNumber('');
    setPassword('');
    if (citiesList.length > 0) {
      setCityId(citiesList[0].id.toString());
    } else {
      setCityId('');
    }
    setShowAddModal(true);
  };

  const handleOpenEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFullName(admin.full_name);
    setPhoneNumber(admin.phone_number);
    setPassword('');
    setCityId(admin.city_id?.toString() || (citiesList.length > 0 ? citiesList[0].id.toString() : ''));
    setStatus(admin.status);
    setShowEditModal(true);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !password) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      await api.post('/admin/admins', {
        fullName,
        phoneNumber,
        password,
        cityId: parseInt(cityId),
      });
      setShowAddModal(false);
      fetchAdmins();
    } catch (error: any) {
      console.error('Failed to create admin:', error);
      alert(error.response?.data?.error || 'Failed to create admin.');
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    if (!fullName || !phoneNumber) {
      alert('Please fill out all fields.');
      return;
    }
    try {
      await api.put(`/admin/admins/${selectedAdmin.id}`, {
        fullName,
        phoneNumber,
        password: password || undefined,
        cityId: parseInt(cityId),
        status,
      });
      setShowEditModal(false);
      fetchAdmins();
    } catch (error: any) {
      console.error('Failed to update admin:', error);
      alert(error.response?.data?.error || 'Failed to update admin.');
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    const newStatus = admin.status === 'blocked' ? 'active' : 'blocked';
    if (!window.confirm(t('common.confirm') || 'Are you sure?')) return;
    try {
      await api.put(`/admin/admins/${admin.id}`, {
        fullName: admin.full_name,
        phoneNumber: admin.phone_number,
        cityId: admin.city_id,
        status: newStatus,
      });
      fetchAdmins();
    } catch (e) {
      console.error('Failed to toggle admin status:', e);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm(t('common.confirm_delete') || 'هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      fetchAdmins();
    } catch (e) {
      console.error('Failed to delete admin:', e);
      alert('خطأ أثناء حذف الأدمن.');
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'blocked':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-100">{t('admins.title') || 'إدارة الأدمن'}</h2>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-slate-950 cursor-pointer transition shadow-lg shadow-emerald-500/10"
        >
          <UserPlus className="h-4 w-4" />
          <span>{t('admins.add_admin') || 'إضافة أدمن جديد'}</span>
        </button>
      </div>

      {/* Main Table */}
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
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-slate-900 rounded-3xl bg-slate-900/10 backdrop-blur-md">
          <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
          <span className="text-sm text-slate-500 font-medium">لا يوجد مسؤولين حالياً.</span>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 shadow-xl backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-start">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 text-xxs font-bold uppercase tracking-wider">
                  <th className="pb-3 text-start">الاسم الكامل / Name</th>
                  <th className="pb-3 text-start">رقم الهاتف / Phone</th>
                  <th className="pb-3 text-start">المدينة / City</th>
                  <th className="pb-3 text-start">تاريخ الإضافة / Registered</th>
                  <th className="pb-3 text-start">{t('common.status')}</th>
                  <th className="pb-3 text-start">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {admins.map((admin) => (
                  <tr key={admin.id} className="text-slate-300 hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 text-slate-200 font-bold text-xs text-start">{admin.full_name}</td>
                    <td className="py-4 text-xs font-semibold text-start">{admin.phone_number}</td>
                    <td className="py-4 text-xs text-start">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-600" />
                        <span>{admin.city_name_ar || admin.city_name_en || 'غير محدد'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-slate-500 text-start">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(admin.created_at).toLocaleDateString('en-US')}</span>
                      </div>
                    </td>
                    <td className="py-4 text-start">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase ${getStatusBadge(admin.status)}`}>
                        {admin.status === 'blocked' ? 'معلق / Suspended' : 'نشط / Active'}
                      </span>
                    </td>
                    <td className="py-4 text-start flex gap-2">
                      <button
                        onClick={() => handleOpenEditModal(admin)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 px-3 py-1.5 text-xxs font-bold text-slate-300 cursor-pointer transition animate-hover"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xxs font-bold cursor-pointer transition animate-hover ${
                          admin.status === 'blocked'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/5 text-rose-400 border-rose-500/20 hover:bg-rose-500/10'
                        }`}
                      >
                        {admin.status === 'blocked' ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        <span>{admin.status === 'blocked' ? 'تنشيط' : 'تعليق'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-600/30 bg-rose-950/20 hover:bg-rose-900/40 px-3 py-1.5 text-xxs font-bold text-rose-500 cursor-pointer transition animate-hover"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>حذف نهائي</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-100">إضافة أدمن جديد / Add Admin</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">الاسم الكامل / Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد أحمد..."
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">رقم الهاتف / Phone Number</label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="770000000"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">كلمة المرور / Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">المدينة / City</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {citiesList.map((city) => (
                    <option key={city.id} value={city.id} className="bg-slate-950">
                      {city.name_ar} ({city.name_en})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-900 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-base font-bold text-slate-100">تعديل بيانات الأدمن / Edit Admin</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">الاسم الكامل / Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">رقم الهاتف / Phone Number</label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">كلمة المرور (اتركها فارغة لعدم التغيير) / Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">المدينة / City</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {citiesList.map((city) => (
                    <option key={city.id} value={city.id} className="bg-slate-950">
                      {city.name_ar} ({city.name_en})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">حالة الحساب / Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-900 bg-slate-900/50 p-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="active" className="bg-slate-950">نشط / Active</option>
                  <option value="blocked" className="bg-slate-950">معلق / Suspended</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors cursor-pointer"
                >
                  تحديث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
