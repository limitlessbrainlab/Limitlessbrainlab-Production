import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, CircleDashed } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

// Admin view of assessment purchases and their completion state.
const AssessmentResults = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessment_purchases')
        .select('id, patient_email, assessment_name, amount_paid, currency, purchased_at, link_opened_at, assessment_completed_at')
        .order('purchased_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      console.error('Error loading assessment results:', err);
      toast.error('Failed to load assessment results');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stateBadge = (r) => {
    if (r.assessment_completed_at) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" /> Completed</span>;
    }
    if (r.link_opened_at) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="h-3 w-3" /> Opened</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600"><CircleDashed className="h-3 w-3" /> Not started</span>;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Assessment Purchases & Results</h3>
          <p className="text-xs text-gray-500 mt-0.5">Completion is reported by the JotForm submission webhook.</p>
        </div>
        <button onClick={load} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-gray-500 text-sm">No assessment purchases yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient Email</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.purchased_at ? new Date(r.purchased_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{r.patient_email}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.assessment_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{r.amount_paid != null ? `${r.currency || 'USD'} ${Number(r.amount_paid).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">{stateBadge(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssessmentResults;
