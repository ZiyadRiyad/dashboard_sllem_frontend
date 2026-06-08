'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  User, 
  Phone, 
  Shield, 
  Activity, 
  MapPin, 
  Calendar, 
  Lock, 
  Upload, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
];

export default function AdminProfile() {
  const t = useTranslations();
  
  // Profile state
  const [user, setUser] = useState<any>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cityId, setCityId] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  
  // Collapsible Password Section State
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Show/Hide password toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Form submission feedback states
  const [updateLoading, setUpdateLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // OTP Verification Flow State
  const [originalPhone, setOriginalPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(true); // default true since matches original
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpErrorMsg, setOtpErrorMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');

  // Fetch admin and cities
  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [meRes, citiesRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/cities')
      ]);

      const userData = meRes.data.user || {};
      setUser(userData);
      
      // Populate fields
      setFullName(userData.fullName || userData.full_name || '');
      setPhoneNumber(userData.phoneNumber || userData.phone_number || '');
      setOriginalPhone(userData.phoneNumber || userData.phone_number || '');
      setCityId(userData.cityId || userData.city_id || '');
      
      // Load saved avatar choice if present
      const savedAvatar = localStorage.getItem('sllem_admin_avatar');
      if (savedAvatar) {
        setSelectedAvatar(savedAvatar);
      } else {
        setSelectedAvatar(AVATAR_PRESETS[0]);
      }

      setCities(citiesRes.data || []);
    } catch (e) {
      console.error('Failed to load profile settings:', e);
      setErrorMsg('حدث خطأ أثناء تحميل بيانات الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Track if phone number was modified
  useEffect(() => {
    if (phoneNumber !== originalPhone) {
      setPhoneVerified(false);
    } else {
      setPhoneVerified(true);
      setOtpSent(false);
    }
  }, [phoneNumber, originalPhone]);

  // Phase 1: Send WhatsApp OTP
  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setOtpErrorMsg('يرجى إدخال رقم الهاتف الجديد أولاً');
      return;
    }
    
    try {
      setOtpSending(true);
      setOtpErrorMsg('');
      setOtpSuccessMsg('');
      setDevOtp('');

      const res = await api.post('/auth/send-otp', {
        phoneNumber,
        checkExists: false // Allow configuring new phone number that doesn't exist
      });

      setOtpSent(true);
      setOtpSuccessMsg('تم إرسال رمز التحقق (OTP) بنجاح عبر حساب الواتساب الخاص بك');
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
      }
    } catch (err: any) {
      console.error('Failed sending profile verification OTP:', err);
      setOtpErrorMsg(err.response?.data?.error || 'فشل إرسال رمز التحقق. يرجى التأكد من تشغيل روبوت الواتساب.');
    } finally {
      setOtpSending(false);
    }
  };

  // Phase 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setOtpErrorMsg('يرجى إدخال الرمز المكون من 6 أرقام');
      return;
    }

    try {
      setOtpVerifying(true);
      setOtpErrorMsg('');
      setOtpSuccessMsg('');

      await api.post('/auth/verify-otp', {
        phoneNumber,
        code: otpCode
      });

      setPhoneVerified(true);
      setOtpSent(false);
      setOtpSuccessMsg('✓ تم التحقق بنجاح! رقم الهاتف الجديد معتمد ومؤكد الآن.');
      setOriginalPhone(phoneNumber); // lock it as verified
    } catch (err: any) {
      console.error('Failed verifying profile OTP:', err);
      setOtpErrorMsg(err.response?.data?.error || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Submit Profile details update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('اسم المشرف مطلوب');
      return;
    }

    if (!phoneVerified) {
      setErrorMsg('الرجاء التحقق من رقم الهاتف الجديد بواسطة رمز التحقق OTP أولاً');
      return;
    }

    try {
      setUpdateLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      // PATCH /auth/profile
      await api.patch('/auth/profile', {
        fullName,
        phoneNumber,
        cityId: cityId ? parseInt(cityId) : null
      });

      // Save avatar locally
      localStorage.setItem('sllem_admin_avatar', selectedAvatar);
      
      // Update local storage user object so layouts updates
      const localUserStr = localStorage.getItem('sllem_admin_user');
      if (localUserStr) {
        const localUser = JSON.parse(localUserStr);
        localUser.fullName = fullName;
        localUser.phoneNumber = phoneNumber;
        localStorage.setItem('sllem_admin_user', JSON.stringify(localUser));
        window.dispatchEvent(new Event('sllem-admin-user-updated'));
      }

      setSuccessMsg('تم حفظ وتعديل بيانات ملفك الشخصي بنجاح');
      
      // Reload profile
      await loadProfileData();
    } catch (err: any) {
      console.error('Failed to update admin profile:', err);
      setErrorMsg(err.response?.data?.error || 'فشل تحديث بيانات الملف الشخصي');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Submit Password update exclusively
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordError('يرجى كتابة كلمة المرور الجديدة');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور الجديدتان غير متطابقتين');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');
      setPasswordSuccess('');

      await api.patch('/auth/profile', {
        password: newPassword
      });

      setPasswordSuccess('✓ تم تحديث وتأمين كلمة المرور الإدارية الجديدة بنجاح');
      
      // Clear inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Collapse section after a short delay
      setTimeout(() => {
        setPasswordOpen(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setPasswordError(err.response?.data?.error || 'فشل تحديث كلمة المرور');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-medium">جاري تحميل بيانات كرت المشرف...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Welcome Banner */}
      <div className="rounded-[2rem] border border-slate-900 bg-gradient-to-tr from-slate-900/60 to-slate-950 p-6 md:p-8 backdrop-blur-md">
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <User className="h-6 w-6 text-amber-400" />
          <span>الملف الشخصي وإعدادات المشرف</span>
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          تصفح صلاحياتك وإداراتك، وعدّل اسمك ووسائل تواصلك المشرفة، أو قم بتحديث كلمة المرور بأمان.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Col 1: Profile Premium Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-900/20 p-6 shadow-xl backdrop-blur-md flex flex-col items-center text-center">
            {/* Background Glow */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-amber-500/10 to-transparent" />
            
            {/* Avatar container */}
            <div className="relative mt-4">
              <img
                src={selectedAvatar}
                alt="Admin Avatar"
                className="h-24 w-24 rounded-full border-4 border-slate-800 object-cover shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-100 mt-4">{fullName}</h3>
            <span className="text-xxs font-bold text-slate-500 mt-1 uppercase flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>مدير عام النظام / SUPERADMIN</span>
            </span>

            {/* Specs list */}
            <div className="w-full mt-6 space-y-3.5 border-t border-slate-900/60 pt-5 text-right text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">حالة الحساب</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-black">
                  <Activity className="h-3.5 w-3.5" />
                  <span>نشط ومؤمن</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">رقم الهاتف</span>
                <span className="font-mono text-slate-300 font-bold">{phoneNumber}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">المدينة الإدارية</span>
                <span className="text-slate-300 font-bold">
                  {cities.find(c => c.id.toString() === cityId.toString())?.name_ar || 'اليمن / عام'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">تاريخ الانضمام</span>
                <span className="text-slate-300 font-bold flex items-center gap-1 font-mono">
                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                  <span>2026/05/20</span>
                </span>
              </div>
            </div>

            {/* Active System Permissions list */}
            <div className="w-full mt-5 border-t border-slate-900/60 pt-4 text-right">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-2">أذونات المشرف النشطة</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'إدارة السائقين وتوثيق المستندات',
                  'إعداد فئات التوصيل وبث الإشعارات',
                  'إدارة أسعار المسارات والرحلات',
                  'الصلاحية الإدارية الكاملة'
                ].map((perm, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold bg-slate-950 text-slate-400 border border-slate-850">
                    ✓ {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Col 2 & 3: Profile Edit Controls and Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Edit Form Card */}
          <div className="rounded-[2.5rem] border border-slate-900 bg-slate-900/20 p-6 md:p-8 shadow-xl backdrop-blur-md">
            <h3 className="text-sm font-black text-slate-200 mb-6 pb-2 border-b border-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-amber-400" />
              <span>تعديل تفاصيل الملف الشخصي</span>
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {successMsg && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Avatar Selector Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 block">اختر أيقونة الصورة الشخصية المفضلة</label>
                <div className="flex gap-3 flex-wrap">
                  {AVATAR_PRESETS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`h-12 w-12 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedAvatar === av ? 'border-amber-500 scale-[1.08] ring-2 ring-amber-500/25' : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Preset Avatar" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & City fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">الاسم الكامل للمشرف</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-850 bg-slate-950 p-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">المدينة الافتراضية</label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-850 bg-slate-950 p-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                  >
                    <option value="">اختر المدينة الافتراضية</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id.toString()}>
                        {city.name_ar} ({city.name_en})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone number & OTP flow section */}
              <div className="border-t border-slate-900/60 pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">رقم جوال المشرف (يتطلب التحقق الفوري في حال التغيير)</label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 rounded-2xl border border-slate-850 bg-slate-950 p-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    />

                    {!phoneVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpSending}
                        className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 text-xs cursor-pointer transition-all disabled:opacity-40"
                      >
                        {otpSending ? 'جاري الإرسال...' : 'إرسال رمز OTP'}
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP alerts and codes input panel */}
                {!phoneVerified && (
                  <div className="rounded-2xl border border-slate-850 bg-slate-950/60 p-4 space-y-4 animate-fadeIn">
                    <div className="flex items-start gap-2 text-xxs font-bold text-amber-400">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>رقم الهاتف المكتوب يختلف عن رقمك المعتمد حالياً. لتغييره، يتوجب عليك التحقق منه بواسطة الرمز المرسل لحساب الواتس الخاص بك لتجنب إقفال حسابك الإداري.</span>
                    </div>

                    {otpSuccessMsg && (
                      <div className="text-xs font-semibold text-emerald-400">{otpSuccessMsg}</div>
                    )}
                    {otpErrorMsg && (
                      <div className="text-xs font-semibold text-rose-400">{otpErrorMsg}</div>
                    )}

                    {/* Developer Mock OTP Hint */}
                    {devOtp && (
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xxs font-bold text-amber-400">
                        🤖 رمز تجريبي لواتساب المطور: <span className="font-mono text-xs font-black">{devOtp}</span>
                      </div>
                    )}

                    {otpSent && (
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="أدخل رمز التحقق (6 أرقام)"
                          maxLength={6}
                          className="flex-1 rounded-2xl border border-slate-850 bg-slate-950 p-3 text-xs text-center text-slate-200 tracking-widest font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={otpVerifying}
                          className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 text-xs cursor-pointer transition-all"
                        >
                          {otpVerifying ? 'جاري التأكيد...' : 'تأكيد الرمز'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-900/60 flex justify-end">
                <button
                  type="submit"
                  disabled={updateLoading || !phoneVerified}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 px-10 text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/10"
                >
                  {updateLoading ? 'جاري حفظ التعديلات...' : 'حفظ وتعديل تفاصيل الملف الشخصي'}
                </button>
              </div>
            </form>
          </div>

          {/* Secure Password Update Collapsible Card */}
          <div className="rounded-[2.5rem] border border-slate-900 bg-slate-900/20 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-300">
            {/* Header toggle button */}
            <button
              onClick={() => {
                setPasswordOpen(!passwordOpen);
                setPasswordError('');
                setPasswordSuccess('');
              }}
              className="w-full flex items-center justify-between p-6 md:p-8 bg-slate-950/20 hover:bg-slate-950/40 transition-colors cursor-pointer text-right"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-slate-200">تغيير كلمة المرور الإدارية / Update Password</h3>
                  <p className="text-[10px] text-slate-400 mt-1">تحديث كلمة مرور لوحة التحكم المشرفة بشكل مستقل وآمن.</p>
                </div>
              </div>
              {passwordOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            </button>

            {/* Collapsed form body */}
            {passwordOpen && (
              <div className="p-6 md:p-8 border-t border-slate-900/40 space-y-6 animate-fadeIn">
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  {passwordSuccess && (
                    <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {/* Current Password Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block font-sans">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="أدخل كلمة مرورك الحالية المعتمدة بالمنصة..."
                        className="w-full rounded-2xl border border-slate-850 bg-slate-950 p-4 pl-12 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password & Confirm fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">كلمة المرور الجديدة</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="اكتب كلمة مرور جديدة قوية..."
                          className="w-full rounded-2xl border border-slate-850 bg-slate-950 p-4 pl-12 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block">تأكيد كلمة المرور الجديدة</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="أعد كتابة كلمة المرور الجديدة للتطابق..."
                          className="w-full rounded-2xl border border-slate-850 bg-slate-950 p-4 pl-12 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-slate-900/60 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 px-10 text-xs transition-all cursor-pointer disabled:opacity-40"
                    >
                      {passwordLoading ? 'جاري تحديث كلمة المرور...' : 'تحديث كلمة المرور الإدارية'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
