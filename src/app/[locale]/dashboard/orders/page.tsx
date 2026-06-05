'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  ClipboardList, 
  User, 
  MapPin, 
  Truck, 
  Calendar,
  AlertCircle,
  X,
  XCircle,
  UserPlus,
  RefreshCw,
  Coins,
  CheckCircle,
  Inbox,
  ArrowLeftRight,
  Zap,
  Boxes,
  Search,
  Filter,
  SlidersHorizontal
} from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  driver_name: string | null;
  driver_phone: string | null;
  receiver_name: string;
  receiver_phone: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  category_name: string;
  size_name: string;
  actual_weight: string;
  distance_km: string;
  total_price: string;
  created_at: string;
  size_id: string;
  from_city_name_ar?: string;
  from_city_name_en?: string;
  to_city_name_ar?: string;
  to_city_name_en?: string;
  quantity?: number;
  delivery_type?: string;
  payment_method?: string;
  is_fragile?: boolean;
  package_photo?: string;
}

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  vehicle_type: string;
  driver_status: string;
  user_status: string;
}

interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

export default function OrdersManagement() {
  const t = useTranslations();
  const [orders, setOrders] = useState<Order[]>([]);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    const host = baseUrl.replace(/\/api$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${host}${cleanPath}`;
  };
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  // Filter & Search Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Modal State
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, driversRes, citiesRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/drivers'),
        api.get('/cities').catch(() => ({ data: [] }))
      ]);
      setOrders(ordersRes.data || []);
      setDrivers((driversRes.data || []).filter((d: any) => d.driver_status === 'approved' && d.user_status === 'active'));
      setCities(citiesRes.data || []);
    } catch (e) {
      console.error('Error loading orders data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(t('common.confirm') || 'هل أنت متأكد من إلغاء وتجميد هذا الطلب؟')) return;
    try {
      await api.patch(`/admin/orders/${orderId}/cancel`);
      loadData();
    } catch (e) {
      console.error('Error cancelling order:', e);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !selectedDriverId) return;

    setAssignLoading(true);
    setAssignError('');

    try {
      await api.patch(`/admin/orders/${assigningOrder.id}/assign`, {
        driverId: selectedDriverId,
      });
      setAssigningOrder(null);
      setSelectedDriverId('');
      loadData();
    } catch (error: any) {
      console.error(error);
      setAssignError(error.response?.data?.error || t('orders.assign_failed') || 'فشل تعيين السائق');
    } finally {
      setAssignLoading(false);
    }
  };

  // Reset all filters in toolbar
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedStatusFilter('');
    setSelectedDate('');
  };

  // Convert status enums to human readable Arabic labels
  const getArabicStatusLabel = (status: string) => {
    if (!status) return 'قيد الانتظار';
    const norm = status.trim().toUpperCase();
    switch (norm) {
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return 'قيد الانتظار';
      case 'DRIVER_ACCEPTED':
      case 'ACCEPTED':
        return 'تم قبول الطلب';
      case 'PARCEL_COLLECTED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'تم استلام الطرد';
      case 'DELIVERED':
        return 'تم تسليم الطرد';
      case 'COMPLETED':
        return 'مكتمل';
      case 'CANCELLED':
        return 'ملغي';
      case 'REJECTED':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (!status) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    const norm = status.trim().toUpperCase();
    switch (norm) {
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'DRIVER_ACCEPTED':
      case 'ACCEPTED':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'PARCEL_COLLECTED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'DELIVERED':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // Base list segmentation
  const activeOrders = orders.filter(o => 
    ['PENDING', 'PENDING_APPROVAL', 'DRIVER_ACCEPTED', 'ACCEPTED', 'PARCEL_COLLECTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']
      .includes((o.status || '').trim().toUpperCase())
  );

  const completedOrders = orders.filter(o => 
    (o.status || '').trim().toUpperCase() === 'COMPLETED'
  );

  const cancelledOrders = orders.filter(o => 
    ['CANCELLED', 'REJECTED']
      .includes((o.status || '').trim().toUpperCase())
  );

  // Broad Tab selection
  const getTabOrdersList = () => {
    if (activeTab === 'completed') return completedOrders;
    if (activeTab === 'cancelled') return cancelledOrders;
    return activeOrders;
  };

  // Apply Search, City, Date and Status filters locally
  const getFilteredOrders = () => {
    const list = getTabOrdersList();
    return list.filter(order => {
      // 1. Search Query (matches Order ID, Customer Name/Phone, Receiver Name/Phone)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesId = (order.id || '').toLowerCase().includes(q);
        const matchesCustomer = (order.customer_name || '').toLowerCase().includes(q) || 
                                (order.customer_phone || '').includes(q);
        const matchesReceiver = (order.receiver_name || '').toLowerCase().includes(q) || 
                                (order.receiver_phone || '').includes(q);
        if (!matchesId && !matchesCustomer && !matchesReceiver) return false;
      }

      // 2. City Filter
      if (selectedCity !== '') {
        const fromCity = (order.from_city_name_ar || '').toLowerCase();
        const toCity = (order.to_city_name_ar || '').toLowerCase();
        const qCity = selectedCity.toLowerCase();
        if (!fromCity.includes(qCity) && !toCity.includes(qCity)) return false;
      }

      // 3. Status sub-filter
      if (selectedStatusFilter !== '') {
        if ((order.status || '').trim().toUpperCase() !== selectedStatusFilter.trim().toUpperCase()) return false;
      }

      // 4. Date Filter
      if (selectedDate !== '') {
        const dateStr = new Date(order.created_at).toISOString().split('T')[0];
        if (dateStr !== selectedDate) return false;
      }

      return true;
    });
  };

  const filteredList = getFilteredOrders();

  // Platform commission sum based solely on Completed orders (20%)
  const totalPlatformEarnings = completedOrders.reduce((sum, o) => {
    const price = parseFloat(o.total_price) || 0;
    return sum + (price * 0.20);
  }, 0);

  const statsList = [
    {
      title: 'إجمالي الطلبات بالمنصة',
      value: orders.length,
      icon: ClipboardList,
      color: 'from-blue-500 to-indigo-500 shadow-blue-500/10',
      subtitle: 'جميع الحالات والعمليات'
    },
    {
      title: 'شحنات نشطة جارية',
      value: activeOrders.length,
      icon: Truck,
      color: 'from-amber-500 to-orange-500 shadow-amber-500/10',
      subtitle: 'قيد التوصيل والتحميل'
    },
    {
      title: 'عمليات التوصيل الناجحة',
      value: completedOrders.length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10',
      subtitle: 'مكتملة ومستلمة بالكامل'
    },
    {
      title: 'أرباح المنصة الصافية (20%)',
      value: `${totalPlatformEarnings.toLocaleString('en-US')} ر.ي`,
      icon: Coins,
      color: 'from-cyan-500 to-emerald-500 shadow-cyan-500/10',
      subtitle: 'محتسبة من التوصيلات المكتملة'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto" dir="rtl">
      {/* Welcome & Stats Header */}
      <div className="rounded-[2rem] border border-slate-900 bg-gradient-to-tr from-slate-900/60 to-slate-950 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-emerald-400" />
              <span>إدارة طلبات التوصيل والخدمات اللوجستية</span>
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              تابع العمليات التشغيلية، وراقب خط سير الشحنات النشطة، واستخدم شريط الفلترة الشامل للبحث والتحليل.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all font-semibold text-xs cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تحديث البيانات</span>
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
              <span className="text-2xl font-black text-slate-100 block tracking-tight font-mono">
                {card.value}
              </span>
              <span className="text-xxs font-medium text-slate-500 block mt-2">
                {card.subtitle}
              </span>
            </div>
          );
        })}
      </div>

      {/* Global Advanced Filtering Toolbar */}
      <div className="rounded-[2rem] border border-slate-900 bg-slate-900/10 p-5 md:p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-xs font-black text-slate-200">شريط فلترة الطلبات والبحث المتقدم</h3>
          </div>
          {(searchQuery || selectedCity || selectedStatusFilter || selectedDate) && (
            <button
              onClick={handleClearFilters}
              className="text-[10px] font-black text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              إعادة تعيين الفلاتر ❌
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filter 2: City */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 block">فلترة حسب المدينة</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">كل المدن</option>
              {cities.map((city) => (
                <option key={city.id} value={city.name_ar}>
                  {city.name_ar}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Sub Status */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 block">تحديد الحالة التشغيلية</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="">جميع الحالات</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="DRIVER_ACCEPTED">تم قبول الطلب</option>
              <option value="PARCEL_COLLECTED">تم استلام الطرد</option>
              <option value="DELIVERED">تم تسليم الطرد</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>

          {/* Filter 4: Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 block">تاريخ إنشاء الطلب</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-850 bg-slate-950 p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Modern Professional Category Tabs */}
      <div className="flex border-b border-slate-900/60 pb-1 gap-2 flex-wrap">
        <button
          onClick={() => {
            setActiveTab('active');
            handleClearFilters();
          }}
          className={`relative px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>الطلبات النشطة والجارية</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xxs font-black text-amber-400">
            {activeOrders.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('completed');
            handleClearFilters();
          }}
          className={`relative px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>الطلبات المكتملة والناجحة</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xxs font-black text-emerald-400">
            {completedOrders.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cancelled');
            handleClearFilters();
          }}
          className={`relative px-5 py-3 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
            activeTab === 'cancelled'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <XCircle className="h-4 w-4" />
          <span>الطلبات الملغية والمرفوضة</span>
          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xxs font-black text-rose-400">
            {cancelledOrders.length}
          </span>
        </button>
      </div>

      {/* Main List Panel */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">جاري تحميل وتزامن قائمة الطلبات...</span>
          </div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 border border-slate-900 rounded-[2.5rem] bg-slate-900/10 backdrop-blur-md p-6 text-center">
          <Inbox className="h-12 w-12 text-slate-700 mb-4 animate-bounce" />
          <h4 className="text-slate-200 font-black text-sm">
            لا توجد أي نتائج مطابقة لخيارات الفلترة والبحث المحددة
          </h4>
          <p className="text-slate-500 text-xs font-semibold max-w-sm mt-2 leading-relaxed">
            جرب إدخال عبارة بحث أخرى، أو تغيير المنطقة/المدينة، أو الضغط على زر "إعادة تعيين الفلاتر" أعلاه.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredList.map((order) => {
            const price = parseFloat(order.total_price) || 0;
            const platformShare = price * 0.20; // 20% platform share

            return (
              <div
                key={order.id}
                className="relative overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-900/20 p-6 md:p-8 shadow-xl backdrop-blur-md hover:border-slate-800/80 transition-all duration-300"
              >
                {/* Spacing improved card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-900/80 pb-5 mb-5">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    {/* Native Arabic Status Badge chip - NO inline dropdown near status */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black shadow-sm ${getStatusBadgeClass(order.status)}`}>
                      <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                      <span>{getArabicStatusLabel(order.status)}</span>
                    </span>

                    <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      <span>{new Date(order.created_at).toLocaleString('en-US')}</span>
                    </span>
                  </div>

                  {/* Pricing and platform commission beautifully aligned */}
                  <div className="flex gap-8 items-center flex-wrap">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-black tracking-wider block uppercase">سعر التوصيل للعميل</span>
                      <span className="text-xl font-black text-slate-200 font-mono tracking-tight mt-0.5">
                        {price.toLocaleString('en-US')} <span className="text-xs font-bold text-slate-500">ر.ي</span>
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-900" />

                    <div className="text-right">
                      <span className="text-[10px] text-emerald-500 font-black tracking-wider block uppercase">عمولة النظام (20%)</span>
                      <span className="text-xl font-black text-emerald-400 font-mono tracking-tight mt-0.5">
                        {platformShare.toLocaleString('en-US')} <span className="text-xs font-bold text-emerald-500/80">ر.ي</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cities route workflow */}
                <div className="flex items-center justify-between gap-4 mb-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">موقع ومنطقة التحميل</span>
                    <span className="text-sm font-black text-amber-400 mt-0.5">
                      {order.from_city_name_ar || order.from_city_name_en || 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="relative w-full flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-slate-800" /></div>
                      <span className="relative bg-slate-900/90 text-xxs font-extrabold px-3.5 py-1.5 rounded-full border border-slate-800 text-slate-400 flex items-center gap-1">
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>مسار الرحلة</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] text-slate-500 font-bold block">منطقة التوصيل للعميل</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5">
                      {order.to_city_name_ar || order.to_city_name_en || 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* Grid logistics specs */}
                <div className={`grid grid-cols-1 md:grid-cols-2 ${order.package_photo ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 text-sm`}>
                  {/* Col 1: Locations */}
                  <div className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-900/40 flex flex-col justify-between">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-black block uppercase">عنوان استلام الطرد</span>
                        <p className="text-xs font-bold text-slate-200 mt-1 leading-relaxed">{order.pickup_address}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-900/40 my-1" />
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-black block uppercase">عنوان تسليم الشحنة للزبون</span>
                        <p className="text-xs font-bold text-slate-200 mt-1 leading-relaxed">{order.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Customers Contacts - Spacing improved */}
                  <div className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-900/40 flex flex-col justify-between">
                    <div className="flex items-start gap-2.5">
                      <User className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-black block uppercase">العميل المرسل (صاحب الطلب)</span>
                        <p className="text-xs font-black text-slate-200 mt-0.5">{order.customer_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{order.customer_phone}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-900/40 my-1" />
                    <div className="flex items-start gap-2.5">
                      <User className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-500 font-black block uppercase">الزبون المستلم النهائي</span>
                        <p className="text-xs font-black text-slate-200 mt-0.5">{order.receiver_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{order.receiver_phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Detailed Specs */}
                  <div className="space-y-4 bg-slate-950/20 p-5 rounded-2xl border border-slate-900/40 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-black block uppercase mb-2">المواصفات اللوجستية للطلب</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                          {order.category_name}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-800">
                          الحجم: {order.size_name}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 gap-1">
                          <Boxes className="h-3 w-3" />
                          <span>الكمية: {order.quantity || 1} طرد</span>
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black ${order.is_fragile ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-950 text-slate-500 border border-slate-800'}`}>
                          {order.is_fragile ? '⚠️ قابل للكسر' : 'شحنة عادية'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black ${order.delivery_type === 'urgent' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 gap-1' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
                          {order.delivery_type === 'urgent' ? <Zap className="h-3 w-3 text-amber-400" /> : null}
                          {order.delivery_type === 'urgent' ? 'مستعجل عاجل' : 'عادي'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {order.payment_method === 'cash_on_delivery' ? 'الدفع عند التسليم' : 'الدفع المسبق'}
                        </span>
                      </div>
                    </div>

                    {/* Driver details section */}
                    <div className="pt-3 border-t border-slate-900/60 mt-3">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">السائق الموصّل المعيّن</span>
                      {order.driver_name ? (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-200 leading-none">{order.driver_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">{order.driver_phone}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 font-bold">غير معين لسائق بعد</span>
                          {['PENDING', 'PENDING_APPROVAL'].includes((order.status || '').toUpperCase()) && (
                            <button
                              onClick={() => {
                                setAssigningOrder(order);
                                setAssignError('');
                              }}
                              className="flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-slate-950 shadow-md shadow-emerald-500/10 cursor-pointer transition-all duration-200"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              <span>تعيين سائق</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 4: Package Photo */}
                  {order.package_photo && (
                    <div className="bg-slate-950/20 p-5 rounded-2xl border border-slate-900/40 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-black block uppercase mb-2">صورة الطرد المرفقة</span>
                        <div className="relative overflow-hidden rounded-xl border border-slate-900 bg-slate-950/40 h-32 flex items-center justify-center cursor-pointer" onClick={() => window.open(getImageUrl(order.package_photo), '_blank')}>
                          <img 
                            src={getImageUrl(order.package_photo)} 
                            alt="صورة الطرد" 
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-center text-slate-400 mt-2 font-bold cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => window.open(getImageUrl(order.package_photo), '_blank')}>
                        🔍 اضغط لتكبير الصورة
                      </div>
                    </div>
                  )}
                </div>

                {/* Cancel button actions */}
                {['PENDING', 'PENDING_APPROVAL'].includes((order.status || '').toUpperCase()) && (
                  <div className="mt-6 pt-4 border-t border-slate-900/60 flex justify-end">
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-1.5 text-xxs font-bold text-rose-400 cursor-pointer transition-all duration-200"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>إلغاء وتجميد الطلب</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Driver assigning modal popup */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-100">اختر السائق المناسب للشحنة</h3>
              <button
                onClick={() => setAssigningOrder(null)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-6">
              {assignError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">قائمة السائقين النشطين</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">اختر السائق من القائمة</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.vehicle_type === 'motorcycle' ? 'دراجة نارية' : 'سيارة توصيل'}) - {driver.phone_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="rounded-xl border border-slate-800 bg-transparent px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-slate-950 cursor-pointer disabled:opacity-50"
                >
                  {assignLoading ? 'جاري التعيين...' : 'تأكيد وتعيين السائق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
