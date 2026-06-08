'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { 
  Home, 
  ClipboardList, 
  Truck, 
  Users, 
  FolderPlus, 
  DollarSign, 
  LogOut, 
  Globe, 
  Menu, 
  X,
  UserCheck,
  Sun,
  Moon,
  MessageSquare,
  Map, 
  MapPin, 
  Route,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Bell,
  User,
  Settings
} from 'lucide-react';

export default function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('sllem_admin_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('sllem_admin_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const [adminName, setAdminName] = useState('Admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('sllem_admin_token');
    const userStr = localStorage.getItem('sllem_admin_user');

    if (!token || !userStr) {
      router.push('/');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        localStorage.clear();
        router.push('/');
        return;
      }
      setAdminName(user.fullName || 'Admin');
      setIsAuthenticated(true);
    } catch (e) {
      localStorage.clear();
      router.push('/');
    }

    const handleUserUpdate = () => {
      const updatedUserStr = localStorage.getItem('sllem_admin_user');
      if (updatedUserStr) {
        try {
          const user = JSON.parse(updatedUserStr);
          setAdminName(user.fullName || 'Admin');
        } catch (e) {}
      }
    };

    window.addEventListener('sllem-admin-user-updated', handleUserUpdate);
    return () => {
      window.removeEventListener('sllem-admin-user-updated', handleUserUpdate);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleLanguageToggle = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: newLocale });
  };

  const isRtl = locale === 'ar';

  const menuItems = [
    { name: t('nav.home'), href: '/dashboard', icon: Home },
    { name: isRtl ? 'التقارير التحليلية والمالية' : 'Reports & Analytics', href: '/dashboard/reports', icon: TrendingUp },
    { name: isRtl ? 'بث التنبيهات والإشعارات' : 'Send Broadcast Notification', href: '/dashboard/notifications', icon: Bell },
    { name: t('nav.orders'), href: '/dashboard/orders', icon: ClipboardList },
    { name: t('nav.drivers'), href: '/dashboard/drivers', icon: Truck },
    { name: t('nav.customers'), href: '/dashboard/customers', icon: Users },
    { name: t('nav.admins'), href: '/dashboard/admins', icon: ShieldAlert },
    { name: t('nav.categories'), href: '/dashboard/categories', icon: FolderPlus },
    { name: t('nav.sizes'), href: '/dashboard/sizes', icon: DollarSign },
    { name: t('nav.cities'), href: '/dashboard/cities', icon: Map },
    { name: t('nav.route_prices'), href: '/dashboard/route-prices', icon: Route },
    { name: t('nav.whatsapp'), href: '/dashboard/whatsapp', icon: MessageSquare },
    { name: t('nav.otp_settings'), href: '/dashboard/whatsapp-otp', icon: ShieldCheck },
    { name: isRtl ? 'إعدادات وتتبع السائقين (GPS)' : 'Live GPS Tracking Settings', href: '/dashboard/tracking-settings', icon: Settings },
    { name: isRtl ? 'الملف الشخصي والمشرف' : 'Admin Profile Settings', href: '/dashboard/profile', icon: User },
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">{t('common.loading')}</span>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-72 border-slate-900 bg-slate-900/30 backdrop-blur-xl ${isRtl ? 'border-l' : 'border-r'} p-6 h-screen sticky top-0`}>
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <img src="/logo.png" alt="Logo" className="h-14 w-14 object-contain" />
          <div>
            <h2 className="text-base font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{t('common.title')}</h2>
            <span className="text-xxs text-emerald-400/80 font-bold block leading-none">{t('common.system_control')}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="mt-auto border-t border-slate-900/80 pt-6 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-emerald-400 border border-slate-700">
              {adminName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{adminName}</p>
              <div className="flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-emerald-400" />
                <span className="text-xxs text-slate-500 font-medium">{t('common.administrator')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-slate-950/80 backdrop-blur-sm flex justify-start">
          <aside className={`flex flex-col w-72 bg-slate-900 p-6 h-full border-slate-800 ${isRtl ? 'border-l' : 'border-r'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="h-11 w-11 object-contain" />
                <span className="font-bold text-sm">{t('common.title')}</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto pr-1 select-none scrollbar-none">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-slate-400 hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-800 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {adminName.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-300 truncate">{adminName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-100 truncate">
              {menuItems.find((item) => item.href === pathname)?.name || t('nav.dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition-all duration-300 shadow-md cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{t('common.light_theme')}</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">{t('common.dark_theme')}</span>
                </>
              )}
            </button>

            {/* Language switch */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:border-slate-700 transition-all duration-300 shadow-md cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-400" />
              <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </header>

        {/* Children content page */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
