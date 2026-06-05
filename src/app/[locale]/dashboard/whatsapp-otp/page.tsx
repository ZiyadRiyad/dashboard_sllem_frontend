'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import {
  MessageSquare,
  ShieldCheck,
  Save,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

export default function OtpSettings() {
  const t = useTranslations();
  const [whatsappOtpEnabled, setWhatsappOtpEnabled] = useState(true);
  const [otpMode, setOtpMode] = useState<'real' | 'dev'>('real');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings/otp');
      setWhatsappOtpEnabled(res.data.whatsappOtpEnabled);
      setOtpMode(res.data.otpMode);
    } catch (e) {
      console.error('Failed to fetch OTP settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMsg('');
      await api.put('/admin/settings/otp', {
        whatsappOtpEnabled,
        otpMode,
      });
      setSuccessMsg('تم حفظ الإعدادات بنجاح / Settings saved successfully.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <MessageSquare className="h-6 w-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">{t('otp_settings.title') || 'إعدادات OTP وواتساب'}</h2>
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
      ) : (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-8">
          
          {/* Card 1: WhatsApp Gateway Switch */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-slate-900/20 border border-slate-900/60 rounded-2xl">
            <div className="space-y-1.5 max-w-xl text-xs">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                تفعيل التحقق عبر واتساب / WhatsApp OTP
              </h3>
              <p className="text-slate-500 leading-relaxed">
                عند التفعيل، سيتم إرسال رسائل التحقق (OTP) إلى أرقام هواتف المستخدمين عبر بوت واتساب تلقائياً عند التسجيل أو طلب تسجيل الدخول.
              </p>
            </div>
            <button
              onClick={() => setWhatsappOtpEnabled(!whatsappOtpEnabled)}
              className="focus:outline-none transition cursor-pointer text-emerald-400"
            >
              {whatsappOtpEnabled ? (
                <ToggleRight className="h-14 w-14 text-emerald-500 hover:text-emerald-400" />
              ) : (
                <ToggleLeft className="h-14 w-14 text-slate-600 hover:text-slate-500" />
              )}
            </button>
          </div>

          {/* Card 2: OTP Verification Mode Selection */}
          <div className="space-y-4 p-6 bg-slate-900/20 border border-slate-900/60 rounded-2xl text-xs">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              وضع التحقق ومستوى الأمان / Verification Mode
            </h3>
            <p className="text-slate-500 leading-relaxed">
              اختر الوضع المناسب لإنشاء رموز التحقق وتطوير التطبيقات:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Real Mode Option */}
              <div
                onClick={() => setOtpMode('real')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  otpMode === 'real'
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-900 bg-slate-950/20 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="otpMode"
                    checked={otpMode === 'real'}
                    onChange={() => setOtpMode('real')}
                    className="accent-emerald-500"
                  />
                  <span className="font-bold text-slate-200">الوضع الحقيقي / Real WhatsApp OTP</span>
                </div>
                <p className="text-xxs text-slate-500 leading-relaxed">
                  يقوم بإنشاء رمز تحقق عشوائي فريد مكون من 6 أرقام وإرساله للمستخدم، ويتم التحقق من الرمز المدخل بدقة.
                </p>
              </div>

              {/* Dev Mode Option */}
              <div
                onClick={() => setOtpMode('dev')}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  otpMode === 'dev'
                    ? 'border-cyan-500/40 bg-cyan-500/5'
                    : 'border-slate-900 bg-slate-950/20 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="otpMode"
                    checked={otpMode === 'dev'}
                    onChange={() => setOtpMode('dev')}
                    className="accent-cyan-500"
                  />
                  <span className="font-bold text-slate-200">وضع المطورين / Developer Mode</span>
                </div>
                <p className="text-xxs text-slate-500 leading-relaxed">
                  وضع المطورين يعتمد الكود الموحد <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-400">1111</code> كرمز تحقق عالمي مقبول لجميع العمليات والهواتف دون الحاجة لواتساب حقيقي.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-900">
            <div className="flex items-center gap-2 text-xxs text-slate-400">
              <Info className="h-4 w-4 text-slate-500" />
              <span>الإعدادات المحددة يتم تطبيقها فوراً على مستوى النظام والـ API.</span>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {successMsg && (
                <span className="text-xxs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  {successMsg}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-5 py-3 text-xs font-bold text-slate-950 cursor-pointer transition shadow-lg shadow-emerald-500/10 w-full md:w-auto justify-center"
              >
                <Save className="h-4 w-4" />
                <span>حفظ الإعدادات / Save Settings</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
