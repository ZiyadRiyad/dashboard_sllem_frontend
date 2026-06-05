'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  Users, 
  UserMinus, 
  UserPlus, 
  AlertCircle,
  Calendar,
  Lock,
  Unlock,
  Trash2
} from 'lucide-react';

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  status: string;
  created_at: string;
}

export default function CustomersManagement() {
  const t = useTranslations();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers');
      setCustomers(res.data);
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (customer: Customer) => {
    if (!window.confirm(t('common.confirm'))) return;
    
    const newStatus = customer.status === 'blocked' ? 'active' : 'blocked';
    
    try {
      await api.patch(`/admin/customers/${customer.id}/status`, {
        status: newStatus,
      });
      fetchCustomers();
    } catch (e) {
      console.error('Failed to toggle customer status:', e);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm(t('common.confirm_delete') || 'هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await api.delete(`/admin/customers/${id}`);
      fetchCustomers();
    } catch (e) {
      console.error('Failed to delete customer:', e);
      alert('خطأ أثناء حذف المستخدم.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      <div className="flex items-center gap-3 bg-slate-900/30 p-6 rounded-3xl border border-slate-900 backdrop-blur-md">
        <Users className="h-6 w-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">{t('customers.title')}</h2>
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
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-slate-900 rounded-3xl bg-slate-900/10 backdrop-blur-md">
          <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
          <span className="text-sm text-slate-500 font-medium">{t('customers.no_customers')}</span>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 shadow-xl backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-start">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 text-xxs font-bold uppercase tracking-wider">
                  <th className="pb-3 text-start">{t('customers.name')}</th>
                  <th className="pb-3 text-start">{t('customers.phone')}</th>
                  <th className="pb-3 text-start">{t('customers.registered_on')}</th>
                  <th className="pb-3 text-start">{t('common.status')}</th>
                  <th className="pb-3 text-start">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {customers.map((customer) => (
                  <tr key={customer.id} className="text-slate-300 hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 text-slate-200 font-bold text-xs text-start">{customer.full_name}</td>
                    <td className="py-4 text-xs font-semibold text-start">{customer.phone_number}</td>
                    <td className="py-4 text-xs text-slate-500 text-start">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(customer.created_at).toLocaleDateString('en-US')}</span>
                      </div>
                    </td>
                    <td className="py-4 text-start">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xxs font-bold uppercase ${getStatusBadge(customer.status)}`}>
                        {t(`customers.status_${customer.status}`)}
                      </span>
                    </td>
                    <td className="py-4 text-start flex gap-2">
                      {customer.status === 'blocked' ? (
                        <button
                          onClick={() => handleToggleStatus(customer)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 px-3 py-1.5 text-xxs font-bold text-emerald-400 cursor-pointer transition animate-hover"
                        >
                          <Unlock className="h-3 w-3" />
                          <span>{t('customers.unban')}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(customer)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 px-3 py-1.5 text-xxs font-bold text-rose-400 cursor-pointer transition animate-hover"
                        >
                          <Lock className="h-3 w-3" />
                          <span>{t('customers.ban')}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-600/30 bg-rose-950/20 hover:bg-rose-900/40 px-3 py-1.5 text-xxs font-bold text-rose-500 cursor-pointer transition animate-hover"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{t('common.delete_permanently') || 'حذف نهائي'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
