'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  ClipboardList, 
  Truck, 
  Users, 
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface Stats {
  activeOrders: number;
  totalDrivers: number;
  pendingDrivers: number;
  totalCustomers: number;
  totalRevenue: number;
}

interface Order {
  id: string;
  customer_name: string;
  receiver_name: string;
  category_name: string;
  size_name: string;
  total_price: string;
  status: string;
  created_at: string;
}

interface Driver {
  id: string;
  full_name: string;
  phone_number: string;
  vehicle_type: string;
  license_number: string;
}

export default function DashboardHome() {
  const t = useTranslations();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, driversRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/orders'),
        api.get('/admin/drivers'),
      ]);

      setStats(statsRes.data);
      // Take top 5 active orders
      const activeOrds = ordersRes.data
        .filter((o: any) => o.status !== 'delivered' && o.status !== 'cancelled')
        .slice(0, 5);
      setRecentOrders(activeOrds);

      // Take pending drivers
      const pendingDrs = driversRes.data
        .filter((d: any) => d.driver_status === 'pending')
        .slice(0, 5);
      setPendingDrivers(pendingDrs);
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickApproveDriver = async (driverId: string) => {
    try {
      await api.patch(`/admin/drivers/${driverId}/status`, { status: 'approved' });
      fetchDashboardData();
    } catch (e) {
      console.error('Failed to approve driver:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('dashboard.active_orders'),
      value: stats?.activeOrders || 0,
      icon: ClipboardList,
      color: 'from-emerald-500 to-teal-500 shadow-emerald-500/10',
    },
    {
      title: t('dashboard.drivers_count'),
      value: stats?.totalDrivers || 0,
      subValue: `${stats?.pendingDrivers || 0} ${t('dashboard.pending_drivers')}`,
      icon: Truck,
      color: 'from-cyan-500 to-blue-500 shadow-cyan-500/10',
    },
    {
      title: t('dashboard.customers_count'),
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'from-indigo-500 to-violet-500 shadow-indigo-500/10',
    },
    {
      title: t('dashboard.revenue'),
      value: `${(stats?.totalRevenue || 0).toLocaleString('en-US')} YER`,
      icon: DollarSign,
      color: 'from-amber-500 to-orange-500 shadow-amber-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl border border-slate-900 bg-gradient-to-tr from-slate-900/60 to-slate-950 p-6 md:p-8 backdrop-blur-md">
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          <span>{t('dashboard.welcome')}</span>
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-900/10 p-6 shadow-xl backdrop-blur-md hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} text-slate-950 shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-100 block tracking-tight">
                {card.value}
              </span>
              {card.subValue && (
                <span className="text-xs font-medium text-amber-400/90 block mt-2">
                  {card.subValue}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tables segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Active Orders */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-md shadow-xl flex flex-col">
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <span>{t('dashboard.active_deliveries_feed')}</span>
          </h3>

          <div className="flex-1 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
                {t('dashboard.no_active_orders')}
              </div>
            ) : (
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-xxs font-bold uppercase tracking-wider">
                    <th className="pb-3 text-start">{t('dashboard.customer')}</th>
                    <th className="pb-3 text-start">{t('dashboard.receiver')}</th>
                    <th className="pb-3 text-start">{t('dashboard.size')}</th>
                    <th className="pb-3 text-end">{t('dashboard.total_price')}</th>
                    <th className="pb-3 text-start">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-slate-300 hover:bg-slate-900/30">
                      <td className="py-3 text-start font-medium text-slate-200">{order.customer_name}</td>
                      <td className="py-3 text-start">{order.receiver_name}</td>
                      <td className="py-3 text-start">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-0.5 text-xxs font-medium border border-slate-800 text-slate-400">
                          {order.category_name} - {order.size_name}
                        </span>
                      </td>
                      <td className="py-3 text-end font-bold text-emerald-400">
                        {parseFloat(order.total_price).toLocaleString('en-US')} YER
                      </td>
                      <td className="py-3 text-start">
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-xxs font-bold text-emerald-400 border border-emerald-500/20">
                          {t(`orders.status_${order.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Drivers approving queue */}
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 backdrop-blur-md shadow-xl flex flex-col">
          <h3 className="text-base font-bold text-slate-200 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <span>{t('dashboard.pending_approvals')}</span>
          </h3>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px]">
            {pendingDrivers.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-sm text-center">
                {t('dashboard.no_pending_drivers')}
              </div>
            ) : (
              pendingDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition-all duration-300 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{driver.full_name}</h4>
                    <p className="text-xxs text-slate-500 font-medium mt-0.5">{driver.phone_number}</p>
                    <span className="inline-block mt-2 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-xxs font-semibold text-cyan-400">
                      {driver.vehicle_type === 'motorcycle' ? t('drivers.motorcycle') : t('drivers.car')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleQuickApproveDriver(driver.id)}
                    className="flex h-8 items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-3 text-xxs font-bold text-slate-950 transition-all duration-300 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{t('drivers.approve')}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
