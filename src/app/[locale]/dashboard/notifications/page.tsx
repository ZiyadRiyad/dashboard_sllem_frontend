'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  Bell, 
  Send, 
  Users, 
  Truck, 
  UserCheck, 
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  Megaphone,
  Inbox,
  AlertTriangle,
  Info,
  Gift,
  RefreshCw
} from 'lucide-react';

interface SentNotification {
  title: string;
  body: string;
  type: string;
  createdAt: string;
  deliveryCount: string | number;
}

export default function NotificationsManagement() {
  const t = useTranslations();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'drivers' | 'customers' | 'custom'>('all');
  const [notificationType, setNotificationType] = useState<'system' | 'order' | 'promotion' | 'warning'>('system');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'sent' | 'compose'>('sent');

  // History State
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/notifications/sent-history');
      setHistory(res.data || []);
    } catch (e) {
      console.error('Failed to load sent history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة (العنوان ومحتوى الرسالة)');
      return;
    }

    if (target === 'custom' && !phoneNumber.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف للمستلم المحدد');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Call API using the correct payload format, attaching notificationType
      const res = await api.post('/notifications/send', {
        title,
        body,
        target,
        type: notificationType,
        phoneNumber: target === 'custom' ? phoneNumber : undefined
      });

      setSuccessMsg(res.data.message || 'تم إرسال وبث التنبيه بنجاح للمستهدفين');
      setTitle('');
      setBody('');
      setPhoneNumber('');
      
      // Refresh sent history log
      await fetchHistory();
      
      // Switch back to sent history view to see the item
      setTimeout(() => {
        setActiveTab('sent');
        setSuccessMsg('');
      }, 1500);
    } catch (e: any) {
      console.error('Failed to send notification:', e);
      setErrorMsg(e.response?.data?.error || 'فشل إرسال الإشعار. يرجى التحقق من الاتصال بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Analytics calculation
  const totalBroadcastsCount = history.length;
  
  const todayCount = history.filter(n => {
    const d = new Date(n.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }).length;

  const totalDeliveries = history.reduce((sum, n) => sum + (parseInt(n.deliveryCount.toString()) || 0), 0);

  const statsList = [
    {
      title: 'إجمالي حملات البث',
      value: totalBroadcastsCount,
      icon: Bell,
      color: 'from-blue-500 to-indigo-500 shadow-blue-500/10',
      subtitle: 'حملات البث الإشعاري الفعالة'
    },
    {
      title: 'إشعارات تم بثها اليوم',
      value: todayCount,
      icon: Megaphone,
      color: 'from-amber-500 to-orange-500 shadow-amber-500/10',
      subtitle: 'المرسلة خلال 24 ساعة الماضية'
    },
    {
      title: 'وصول الإشعارات للمستقبلين',
      value: totalDeliveries,
      icon: Users,
      color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10',
      subtitle: 'إجمالي عدد الطرود المستلمة للإشعارات'
    },
    {
      title: 'نوع الإشعارات الشائعة',
      value: 'تحديثات النظام',
      icon: Clock,
      color: 'from-cyan-500 to-blue-500 shadow-cyan-500/10',
      subtitle: 'إشعارات الصيانة وتحديث الأسعار'
    }
  ];

  const getNotificationTypeIcon = (type: string) => {
    const norm = (type || '').trim().toLowerCase();
    switch (norm) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case 'promotion': return <Gift className="h-4 w-4 text-emerald-400" />;
      case 'order': return <CheckCircle className="h-4 w-4 text-cyan-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const norm = (type || '').trim().toLowerCase();
    switch (norm) {
      case 'warning': return 'تنبيه أمني / تحذير';
      case 'promotion': return 'عرض ترويجي / إعلان';
      case 'order': return 'شحنات وطلبات';
      default: return 'تحديث عام / نظام';
    }
  };

  const getNotificationTypeClass = (type: string) => {
    const norm = (type || '').trim().toLowerCase();
    switch (norm) {
      case 'warning': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'promotion': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'order': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto" dir="rtl">
      {/* Page Header banner */}
      <div className="rounded-[2rem] border border-slate-900 bg-gradient-to-tr from-slate-900/60 to-slate-950 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
              <Bell className="h-6 w-6 text-amber-400 animate-swing" />
              <span>مركز بث التنبيهات والإشعارات الفورية</span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              أرسل تنبيهات منبثقة فورية للهواتف الذكية للسائقين أو العملاء، وراجع سجل الحملات السابقة.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-all font-semibold text-xs cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تحديث السجل</span>
          </button>
        </div>
      </div>

      {/* Grid Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/10 p-6 shadow-xl backdrop-blur-md hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} text-slate-950 shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-100 block tracking-tight">
                {card.value}
              </span>
              <span className="text-[10px] font-medium text-slate-500 block mt-2">
                {card.subtitle}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tabs System switch */}
      <div className="flex border-b border-slate-900/60 pb-1 gap-2">
        <button
          onClick={() => setActiveTab('sent')}
          className={`relative px-6 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
            activeTab === 'sent'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>الإشعارات المرسلة وسجل البث</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xxs font-black text-amber-400">
            {history.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('compose');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`relative px-6 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
            activeTab === 'compose'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>إنشاء وبث إشعار جديد</span>
        </button>
      </div>

      {/* Tab contents */}
      {activeTab === 'sent' ? (
        loadingHistory ? (
          <div className="flex h-48 items-center justify-center text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs font-medium">جاري استرجاع سجل الإشعارات الفورية...</span>
            </div>
          </div>
        ) : history.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-64 border border-slate-900 rounded-[2.5rem] bg-slate-900/10 backdrop-blur-md p-6 text-center">
            <Inbox className="h-10 w-10 text-slate-700 mb-3 animate-bounce" />
            <h4 className="text-slate-200 font-bold text-sm">سجل الإشعارات فارغ تماماً</h4>
            <p className="text-slate-500 text-xs font-semibold max-w-sm mt-1">
              لم تقم المنصة بإرسال أي حملات بث إشعاري عامة حتى الآن. يمكنك بدء حملتك الأولى بالضغط على "إنشاء وبث إشعار جديد".
            </p>
          </div>
        ) : (
          /* History card timeline listing */
          <div className="grid grid-cols-1 gap-4">
            {history.map((notification, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-900 bg-slate-900/20 p-5 shadow-lg backdrop-blur-md hover:border-slate-800 transition-all duration-300 flex flex-col gap-4 text-right"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/40 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xxs font-black ${getNotificationTypeClass(notification.type)}`}>
                        {getNotificationTypeIcon(notification.type)}
                        <span>{getNotificationTypeLabel(notification.type)}</span>
                      </span>

                      <h4 className="text-sm font-black text-slate-100">{notification.title}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-xxs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(notification.createdAt).toLocaleString('en-US')}
                      </span>

                      <span className="rounded bg-slate-950 border border-slate-850 px-2 py-0.5 text-amber-400 font-black">
                        عدد المستلمين: {notification.deliveryCount} مستخدم
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className={`text-xs text-slate-300 leading-relaxed font-medium ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {notification.body}
                    </p>

                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-black block mt-2 cursor-pointer transition-colors"
                    >
                      {isExpanded ? 'عرض أقل ➔' : 'عرض محتوى الإشعار بالكامل ➔'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Compose Notification form redesign */
        <form onSubmit={handleSend} className="relative overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-900/10 p-6 md:p-8 shadow-xl backdrop-blur-md space-y-6">
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

          {/* Target Audience selection cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 block">فئة المستهدفين بالبث الفوري</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'all', label: 'جميع المستخدمين', icon: Users, desc: 'العملاء والسائقين معاً' },
                { key: 'drivers', label: 'سائقين التوصيل', icon: Truck, desc: 'جميع السائقين المعتمدين' },
                { key: 'customers', label: 'العملاء المرسلون', icon: UserCheck, desc: 'طالبي الخدمة بالمستندات' },
                { key: 'custom', label: 'مستخدم محدد هاتفياً', icon: Smartphone, desc: 'عبر رقم الجوال الخاص به' }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = target === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setTarget(item.key as any);
                      setErrorMsg('');
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5 scale-[1.03] ring-1 ring-amber-500/30'
                        : 'bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-2" />
                    <span className="text-xs font-black block">{item.label}</span>
                    <span className="text-[10px] opacity-60 block mt-1 leading-snug">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Phone input */}
          {target === 'custom' && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-bold text-slate-300 block">رقم الهاتف المستهدف المكون من 9 أرقام</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="مثال: 777123456"
                className="w-full rounded-2xl border border-slate-850 bg-slate-900/50 p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          )}

          {/* Notification Types selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 block">نوع ومستوى الإشعار / Notification Category</label>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'system', label: 'تحديث عام للنظام', icon: Info, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                { key: 'order', label: 'إشعارات شحنة / تسليم', icon: CheckCircle, color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
                { key: 'promotion', label: 'حملة تسويقية وعروض', icon: Gift, color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                { key: 'warning', label: 'تحذير أمني وصيانة', icon: AlertTriangle, color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' }
              ].map((type) => {
                const isTypeSelected = notificationType === type.key;
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setNotificationType(type.key as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isTypeSelected
                        ? `${type.color} ring-1 ring-current scale-[1.02] shadow-sm`
                        : 'bg-slate-900/30 border-slate-900 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <TypeIcon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title and Message */}
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">عنوان التنبيه الرئيسي</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب عنواناً جذاباً وقصيراً للإشعار..."
                className="w-full rounded-2xl border border-slate-850 bg-slate-900/50 p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">مضمون الرسالة والتفاصيل</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب النص التفصيلي هنا الذي سيصل كرسالة منبثقة للمستخدم في هاتفه..."
                className="w-full h-32 rounded-2xl border border-slate-850 bg-slate-900/50 p-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                required
              />
            </div>
          </div>

          {/* Send Broadcast Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 px-6 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>جاري تعبئة وإرسال الإشعار لجميع الأجهزة النشطة...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>بث التنبيه الآن للمستهدفين / Send Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
