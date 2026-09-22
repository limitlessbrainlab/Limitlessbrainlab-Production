import React, { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Wrench } from 'lucide-react';
import SupabaseService from '../../services/supabaseService';

const getToken = async () => {
  const { data } = await SupabaseService.supabase.auth.getSession();
  return data?.session?.access_token || localStorage.getItem('authToken');
};

export default function SystemHealth({ compact = false }) {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('Checking report service…');
  const [working, setWorking] = useState(false);

  const check = useCallback(async () => {
    setWorking(true);
    try {
      const response = await fetch('/api/ops/backend', { headers: { Authorization: `Bearer ${await getToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setStatus(data);
      setMessage(data.backend.healthy ? 'All report systems are working.' : 'Report service is temporarily unavailable.');
    } catch (error) {
      setStatus(null);
      setMessage('Unable to check the report service right now.');
    } finally {
      setWorking(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const restart = async () => {
    if (!window.confirm('Restart the report service? Reports may be unavailable for about two minutes.')) return;
    setWorking(true);
    try {
      const response = await fetch('/api/ops/backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify({ action: 'restart' }),
      });
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) setTimeout(check, 120000);
    } catch { setMessage('Restart could not be requested.'); }
    finally { setWorking(false); }
  };

  const healthy = status?.backend?.healthy;
  if (compact) return <div className={`rounded-lg border px-4 py-3 ${healthy ? 'border-green-300 bg-green-50 text-green-900' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
    <div className="flex items-center gap-2"><Activity className="h-4 w-4" /><span className="text-sm font-semibold">Report service: {healthy ? 'Working' : 'Checking / needs attention'}</span></div>
    <p className="mt-1 text-xs">{message}</p>
    <div className="mt-2 flex items-center gap-2">
      <button onClick={check} disabled={working} className="text-xs font-medium underline disabled:opacity-50"><RefreshCw className="mr-1 inline h-3 w-3" />Check again</button>
      {!healthy && status?.restartConfigured && <button onClick={restart} disabled={working} className="text-xs font-medium underline disabled:opacity-50"><Wrench className="mr-1 inline h-3 w-3" />Restart service</button>}
      <details className="text-xs"><summary className="cursor-pointer">Technical details</summary><span>HTTP {status?.backend?.status ?? 'no response'} · {status?.checkedAt || 'not checked'}</span></details>
    </div>
  </div>;
  return <div className="max-w-3xl space-y-5">
    <div className={`rounded-xl border p-6 ${healthy ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex gap-4">
        <Activity className={healthy ? 'text-green-600' : 'text-amber-600'} />
        <div><h2 className="text-lg font-semibold">System Status</h2><p className="mt-1 text-gray-700">{message}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={check} disabled={working} className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow border disabled:opacity-50"><RefreshCw className="mr-2 inline h-4 w-4" />Check again</button>
        {!healthy && status?.restartConfigured && <button onClick={restart} disabled={working} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Wrench className="mr-2 inline h-4 w-4" />Restart report service</button>}
      </div>
    </div>
    <details className="rounded-xl border bg-white p-5">
      <summary className="cursor-pointer font-medium">Technical details for future support</summary>
      <dl className="mt-4 grid gap-2 text-sm text-gray-600">
        <div><dt className="font-medium text-gray-800">Backend check</dt><dd>{status?.backend?.healthy ? 'Healthy' : status?.backend?.error || 'Not available'}</dd></div>
        <div><dt className="font-medium text-gray-800">HTTP status</dt><dd>{status?.backend?.status ?? 'No response'}</dd></div>
        <div><dt className="font-medium text-gray-800">Checked at</dt><dd>{status?.checkedAt || 'Not available'}</dd></div>
        <div><dt className="font-medium text-gray-800">Restart control</dt><dd>{status?.restartConfigured ? 'Configured' : 'Needs RENDER_API_KEY and RENDER_SERVICE_ID in Vercel production settings'}</dd></div>
      </dl>
    </details>
  </div>;
}
