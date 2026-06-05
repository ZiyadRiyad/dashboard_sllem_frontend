'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  TrendingUp, 
  Users, 
  Truck, 
  Package, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  DollarSign, 
  Percent, 
  Award, 
  Activity,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface ReportData {
  totalUsers: number;
  totalDrivers: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeDeliveries: number;
  totalRevenue: number;
  platformProfit: number;
  driverEarnings: number;
  deliverySuccessRate: number;
  topDrivers: Array<{
    fullName: string;
    completedCount: number;
    earnings: number;
  }>;
  ordersByCity: Array<{
    cityName: string;
    count: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    profit: number;
  }>;
}

export default function ReportsDashboard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/reports');
      setData(res.data);
    } catch (e: any) {
      console.error('Failed to fetch reports:', e);
      setError('حدث خطأ أثناء تحميل التقارير والإحصائيات من السيرفر.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
          <p className="text-xs text-slate-400">جاري إعداد وتحليل البيانات والتقارير المالية...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl max-w-2xl mx-auto my-12">
        <XCircle className="h-10 w-10 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">فشل تحميل لوحة التقارير</h3>
        <p className="text-sm mb-6 opacity-80">{error || 'لا تتوفر أي بيانات حالياً.'}</p>
        <button 
          onClick={fetchReports}
          className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all cursor-pointer"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Helper for status names translation in dashboard
  const translateStatus = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 'قيد الانتظار';
    if (s === 'DRIVER_ACCEPTED') return 'تم قبول السائق';
    if (s === 'PARCEL_COLLECTED') return 'تم استلام الطرد';
    if (s === 'DELIVERED') return 'تم التسليم للوجهة';
    if (s === 'COMPLETED') return 'مكتمل ومدفوع';
    if (s === 'CANCELLED') return 'ملغي';
    return status;
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'DRIVER_ACCEPTED') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s === 'PARCEL_COLLECTED') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (s === 'DELIVERED') return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    if (s === 'COMPLETED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">التقارير التحليلية والمالية</h2>
            <p className="text-xs text-slate-400 mt-1">تقرير أداء منصة سلّم للتوصيل متضمناً الأرباح والعمولات وأنشطة السائقين.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xxs text-slate-400 bg-slate-900/60 py-2 px-3 rounded-xl border border-slate-850">
          <Calendar className="h-3.5 w-3.5 text-amber-500" />
          <span>تحديث فوري تلقائي: {new Date().toLocaleDateString('ar-YE-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Grid of Key Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'إجمالي المستخدمين المسجلين', value: data.totalUsers, subtitle: 'العملاء المستفيدين', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/5' },
          { title: 'سائق توصيل معتمد', value: data.totalDrivers, subtitle: 'سائقين مسجلين بالهوية', icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
          { title: 'إجمالي طلبات الشحن', value: data.totalOrders, subtitle: 'توصيل ومستندات وطرود', icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/5' },
          { title: 'نسبة نجاح التوصيل الفعلي', value: `${data.deliverySuccessRate}%`, subtitle: 'مقارنة بالإلغاء والرفض', icon: Percent, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-6 rounded-3xl border border-slate-900 bg-slate-900/10 shadow-lg backdrop-blur-sm space-y-4 hover:border-slate-800 transition-colors ${card.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xxs font-bold text-slate-400 block">{card.title}</span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-black text-slate-100 block tracking-tight">{card.value}</span>
                <span className="text-xxs text-slate-500 block">{card.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Business Model & Financial Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total revenue Card */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-900/20 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 block">إجمالي مبيعات التوصيل (المنصرمة)</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-400 block">{data.totalRevenue.toLocaleString('en-US')} <span className="text-xs font-medium">ر.ي</span></span>
            <p className="text-xxs text-slate-500 mt-2">القيمة الإجمالية لجميع الفواتير والطلبات المكتملة بنجاح.</p>
          </div>
          <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xxs">
            <span className="text-slate-400 font-medium">معدل الإكمال</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">{data.deliverySuccessRate}%</span>
          </div>
        </div>

        {/* Platform cut (20%) */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-amber-500/5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 block">صافي أرباح المنصة (20%)</span>
            <Percent className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-amber-400 block">{data.platformProfit.toLocaleString('en-US')} <span className="text-xs font-medium">ر.ي</span></span>
            <p className="text-xxs text-slate-500 mt-2">الحصة التشغيلية والخدمية للمنصة (20% تخصم تلقائياً من قيمة الفاتورة).</p>
          </div>
          <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xxs">
            <span className="text-slate-400 font-medium">حصة المنصة الرسمية</span>
            <span className="text-amber-400 font-bold">20% عمولة</span>
          </div>
        </div>

        {/* Driver profit (80%) */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-sky-500/5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 block">مستحقات وأرباح السائقين (80%)</span>
            <Truck className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <span className="text-3xl font-black text-sky-400 block">{data.driverEarnings.toLocaleString('en-US')} <span className="text-xs font-medium">ر.ي</span></span>
            <p className="text-xxs text-slate-500 mt-2">إجمالي ما حصل عليه السائقين والسائقين (80% من قيمة الرحلات).</p>
          </div>
          <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-xxs">
            <span className="text-slate-400 font-medium">حصة السائق الصافية</span>
            <span className="text-sky-400 font-bold">80% للمندوب</span>
          </div>
        </div>
      </div>

      {/* Sub Stats counts (Completed, Cancelled, Active) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-900 bg-slate-900/10">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xxs text-slate-400 block font-bold">الطلبات المكتملة كلياً</span>
            <span className="text-lg font-black text-slate-200">{data.completedOrders} طلب ناجح</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-900 bg-slate-900/10">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xxs text-slate-400 block font-bold">الطلبات الملغاة والمرفوضة</span>
            <span className="text-lg font-black text-slate-200">{data.cancelledOrders} طلب ملغي</span>
          </div>
        </div>
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-900 bg-slate-900/10">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xxs text-slate-400 block font-bold">الرحلات النشطة قيد التوصيل</span>
            <span className="text-lg font-black text-slate-200">{data.activeDeliveries} رحلة جارية</span>
          </div>
        </div>
      </div>

      {/* Charts & Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Orders by City */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-900/10 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-900">
            <MapPin className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-200">توزيع طلبات التوصيل حسب المدن اليمنية</h3>
          </div>

          {data.ordersByCity.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">لا تتوفر إحصائيات مدن بعد.</div>
          ) : (
            <div className="space-y-4">
              {data.ordersByCity.map((city, idx) => {
                const maxVal = Math.max(...data.ordersByCity.map(c => c.count), 1);
                const percent = (city.count / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{city.cityName || 'غير محدد'}</span>
                      <span className="text-slate-400 font-bold">{city.count} شحنة</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Orders by Status */}
        <div className="p-6 rounded-3xl border border-slate-900 bg-slate-900/10 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-900">
            <Layers className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-200">مجموع حالات وحالة دورة حياة الطلبات</h3>
          </div>

          {data.ordersByStatus.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">لا توجد حالات طلبات مسجلة.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Colored status badges list */}
              <div className="space-y-2.5">
                {data.ordersByStatus.map((status, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${getStatusColor(status.status)}`}>
                    <span>{translateStatus(status.status)}</span>
                    <span>{status.count} طلب</span>
                  </div>
                ))}
              </div>

              {/* Dynamic SVG graphic pie-donut representation */}
              <div className="flex justify-center p-2">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="14" fill="transparent" stroke="#0f172a" strokeWidth="4" />
                  {(() => {
                    let total = data.ordersByStatus.reduce((acc, s) => acc + s.count, 0) || 1;
                    let accumulatedPercent = 0;
                    const colors = ['#f59e0b', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#ef4444'];
                    
                    return data.ordersByStatus.map((status, idx) => {
                      const percent = (status.count / total) * 100;
                      const strokeDasharray = `${percent} ${100 - percent}`;
                      const strokeDashoffset = 100 - accumulatedPercent;
                      accumulatedPercent += percent;
                      
                      return (
                        <circle 
                          key={idx}
                          cx="16"
                          cy="16"
                          r="14"
                          fill="transparent"
                          stroke={colors[idx % colors.length]}
                          strokeWidth="4"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          pathLength="100"
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table: Top Drivers */}
      <div className="p-6 rounded-3xl border border-slate-900 bg-slate-900/10 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-200">سائقين التوصيل الأكثر تميزاً ونشاطاً</h3>
          </div>
          <span className="text-xxs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">توب 5</span>
        </div>

        {data.topDrivers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">لا يوجد أداء مسجل للسائقين حتى الآن.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right text-xs">
              <thead>
                <tr className="border-b border-slate-900/80 text-slate-400">
                  <th className="pb-3 pt-1 font-bold">اسم سائق التوصيل / السائق</th>
                  <th className="pb-3 pt-1 font-bold text-center">الرحلات المكتملة</th>
                  <th className="pb-3 pt-1 font-bold text-center">صافي أرباحه (80%)</th>
                  <th className="pb-3 pt-1 font-bold text-left">شارة التميز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {data.topDrivers.map((driver, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 font-bold text-slate-200 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                        {idx + 1}
                      </div>
                      <span>{driver.fullName || 'سائق توصيل'}</span>
                    </td>
                    <td className="py-4 text-center font-bold text-slate-300">{driver.completedCount} رحلة ناجحة</td>
                    <td className="py-4 text-center font-black text-emerald-400">{driver.earnings.toLocaleString('en-US')} ر.ي</td>
                    <td className="py-4 text-left">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[9px]">
                        تميز بلاتيني <ArrowUpRight className="h-2.5 w-2.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
