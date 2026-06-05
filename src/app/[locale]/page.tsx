'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import api from '@/lib/api';
import { Lock, Phone, AlertCircle, Globe, Sun, Moon } from 'lucide-react';

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
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

  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('sllem_admin_token');
    const userStr = localStorage.getItem('sllem_admin_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          router.push('/dashboard');
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, [router]);

  const handleLanguageToggle = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: newLocale });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!phoneNumber || !password) {
      setErrorMessage(t('auth.login_sub'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        phoneNumber,
        password,
      });

      const { token, user } = response.data;

      if (user.role !== 'admin') {
        setErrorMessage(t('auth.error_admin_required'));
        setIsLoading(false);
        return;
      }

      // Save credentials
      localStorage.setItem('sllem_admin_token', token);
      localStorage.setItem('sllem_admin_user', JSON.stringify(user));

      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      const serverErr = error.response?.data?.error;
      setErrorMessage(serverErr || t('auth.error_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = locale === 'ar';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 md:p-8">
      {/* Decorative Neon Orbs */}
      <div className="absolute top-[-10%] left-[-10%] h-[300px] sm:h-[400px] w-[300px] sm:w-[400px] rounded-full bg-emerald-500/10 blur-[80px] sm:blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[300px] sm:h-[400px] w-[300px] sm:w-[400px] rounded-full bg-cyan-500/10 blur-[80px] sm:blur-[120px]" />

      {/* Theme & Language Switcher Top Bar */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 md:right-8 z-10 flex items-center gap-2">
        <button
          onClick={handleThemeToggle}
          className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 hover:text-emerald-400 backdrop-blur-md transition-all duration-300 shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" />
              <span>{t('common.light_theme')}</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-indigo-400" />
              <span>{t('common.dark_theme')}</span>
            </>
          )}
        </button>

        <button
          onClick={handleLanguageToggle}
          className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 hover:text-emerald-400 backdrop-blur-md transition-all duration-300 shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
        >
          <Globe className="h-4 w-4 text-emerald-400" />
          <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo/Platform Name */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            <img src="/logo.png" alt="Logo" className="h-24 w-24 object-contain mx-auto" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {t('common.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            {t('auth.admin_portal')}
          </p>
        </div>

        {/* Card Body */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-slate-950/50">
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            {t('auth.login')}
          </h2>
          <p className="text-xs text-slate-400 mb-6 font-normal">
            {t('auth.login_sub')}
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Phone Number Input */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-xs font-semibold text-slate-300 block">
                {t('auth.phone')}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-500`}>
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phoneNumber"
                  type="text"
                  placeholder={t('auth.phone_placeholder')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full rounded-2xl border border-slate-800 bg-slate-950/80 ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'} py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300 block">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-500`}>
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-2xl border border-slate-800 bg-slate-950/80 ${isRtl ? 'pl-4 pr-12 text-right' : 'pl-12 pr-4 text-left'} py-3.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 font-bold text-slate-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{t('common.loading')}</span>
                </span>
              ) : (
                <span>{t('auth.submit')}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
