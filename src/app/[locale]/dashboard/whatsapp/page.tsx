'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { 
  MessageSquare,
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Link,
  Loader2
} from 'lucide-react';

interface WhatsappStatusResponse {
  status: 'CONNECTED' | 'INITIALIZING' | 'SCAN_PENDING' | 'DISCONNECTED';
  qr: string;
  info: {
    number: string;
    pushname: string;
  } | null;
  botEnabled: boolean;
}

export default function WhatsAppManagement() {
  const t = useTranslations('whatsapp');
  const [data, setData] = useState<WhatsappStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/admin/whatsapp/status');
      setData(res.data);
      setError('');
    } catch (e: any) {
      console.error('Failed to load WhatsApp status:', e);
      setError(e.response?.data?.error || 'Failed to connect to the backend server.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus(true);
    // Poll the status every 5 seconds to automatically capture ready state / QR updates
    const timer = setInterval(() => {
      fetchStatus(false);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleReconnect = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post('/admin/whatsapp/reconnect');
      // Wait 1 second and refresh
      setTimeout(() => fetchStatus(false), 1000);
    } catch (e: any) {
      console.error('Failed to reconnect:', e);
      setError(e.response?.data?.error || 'Failed to execute reconnect action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp?')) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post('/admin/whatsapp/logout');
      // Wait 1 second and refresh
      setTimeout(() => fetchStatus(false), 1000);
    } catch (e: any) {
      console.error('Failed to logout:', e);
      setError(e.response?.data?.error || 'Failed to execute logout action.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
          <span className="text-sm font-medium">{t('loading')}</span>
        </div>
      </div>
    );
  }

  const botEnabled = data?.botEnabled ?? false;
  const status = data?.status ?? 'DISCONNECTED';
  const qr = data?.qr ?? '';
  const info = data?.info;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure, manage, and monitor the automated WhatsApp OTP & message dispatch service.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Feature Flag Warning */}
      {!botEnabled && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-base">{t('bot_disabled')}</h3>
              <p className="text-sm text-amber-400/80 mt-1">{t('bot_disabled_msg')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900/30 backdrop-blur-xl border border-slate-900/80 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400">{t('connection_status')}</span>
              <div className="flex items-center gap-2">
                {status === 'CONNECTED' && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
                {status === 'INITIALIZING' && (
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-cyan-400" />
                )}
                {status === 'SCAN_PENDING' && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
                {status === 'DISCONNECTED' && (
                  <span className="inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                )}
                <span className={`text-xs font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  status === 'INITIALIZING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                  status === 'SCAN_PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {t(status.toLowerCase() as any)}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-900/80" />

            {/* Connection Details */}
            {status === 'CONNECTED' && info ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">{t('account_name')}</span>
                    <span className="text-base font-bold text-slate-200">{info.pushname}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 block">{t('whatsapp_number')}</span>
                    <span className="text-base font-bold text-slate-200">{info.number}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 space-y-3">
                <div className="h-14 w-14 rounded-full bg-slate-950 flex items-center justify-center border border-slate-900 shadow-inner">
                  <MessageSquare className="h-6 w-6 text-slate-600 animate-pulse" />
                </div>
                <div className="max-w-xs">
                  <span className="text-sm font-semibold text-slate-400">
                    {status === 'INITIALIZING' ? 'Setting up session environment...' : 'No active session connected'}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {status === 'INITIALIZING' ? 'The server is spawning Puppeteer browser instance. Please wait...' : 'Ensure your bot is initialized and scan the QR code to connect.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-900/60">
            <button
              onClick={handleReconnect}
              disabled={actionLoading || !botEnabled}
              className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-slate-950 bg-gradient-to-tr from-emerald-400 to-cyan-400 hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 shadow-md cursor-pointer shadow-emerald-500/10"
            >
              {actionLoading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{t('reconnect')}</span>
            </button>

            {status === 'CONNECTED' && (
              <button
                onClick={handleLogout}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('logout')}</span>
              </button>
            )}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="p-8 rounded-3xl bg-slate-900/30 backdrop-blur-xl border border-slate-900/80 flex flex-col items-center justify-center space-y-6 text-center">
          {status === 'SCAN_PENDING' && qr ? (
            <>
              <div className="space-y-2">
                <span className="text-sm font-bold text-slate-200">Scan QR Code</span>
                <p className="text-xs text-slate-500 leading-relaxed px-2">{t('scan_instruction')}</p>
              </div>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xl relative overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=250x250`} 
                  alt="WhatsApp QR Code" 
                  className="w-48 h-48 block"
                />
              </div>
              <span className="text-xxs text-slate-500 animate-pulse flex items-center gap-1.5">
                <Link className="h-3 w-3 text-amber-500" />
                <span>QR updates every 20 seconds.</span>
              </span>
            </>
          ) : status === 'CONNECTED' ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-200">System Connected</span>
                <p className="text-xs text-slate-500 mt-1">WhatsApp daemon is fully loaded and dispatching active logs.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 text-slate-600">
              <Smartphone className="h-16 w-16 stroke-1 animate-pulse" />
              <div>
                <span className="text-sm font-semibold">QR Code Unavailable</span>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                  {status === 'INITIALIZING' ? 'Generating QR token context...' : 'Initialize connection to fetch QR.'}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
