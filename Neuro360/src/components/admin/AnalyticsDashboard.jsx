import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import DatabaseService from '../../services/databaseService';
import analyticsService from '../../services/analyticsService';

const RANGE_LABELS = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days' };

// Sum a time-series array by its numeric `value` field
const sumSeries = (arr) => (arr || []).reduce((s, d) => s + (Number(d.value) || 0), 0);
// Real period-over-period percentage change
const pctChange = (cur, prev) => {
  if (prev > 0) return ((cur - prev) / prev) * 100;
  if (cur > 0) return 100;
  return 0;
};
const fmtPct = (v) => `${v >= 0 ? '+' : ''}${(Number(v) || 0).toFixed(0)}%`;

const AnalyticsDashboard = ({ analytics }) => {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [chartData, setChartData] = useState({ reportsOverTime: [], revenueOverTime: [] });
  const [metrics, setMetrics] = useState({
    totalRevenue: 0, reportsGenerated: 0, activeClinics: 0, avgReports: 0,
    revenueChange: 0, reportsChange: 0, avgChange: 0, clinicsChange: 0
  });
  const [loading, setLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [reports, setReports] = useState([]);

  // Fetch source data on mount / when the analytics prop changes. Kept separate
  // from chart generation so that setRealTimeData() here does not re-trigger the
  // fetch (which would loop, since getSystemAnalytics returns a fresh object).
  useEffect(() => {
    loadRealAnalytics();
    loadData();
  }, [analytics]);

  // Recompute metrics + charts whenever the range, the prop, or the freshly
  // fetched realTimeData changes. This effect never calls setRealTimeData, so
  // there is no feedback loop.
  useEffect(() => {
    generateChartData();
  }, [timeRange, analytics, realTimeData]);

  const loadData = async () => {
    try {
      const [clinicsData, reportsData] = await Promise.all([
        DatabaseService.get('clinics'),
        DatabaseService.get('reports')
      ]);
      setClinics(clinicsData || []);
      setReports(reportsData || []);
    } catch (error) {
      console.error('ERROR: Error loading data:', error);
      setClinics([]);
      setReports([]);
    }
  };

  const loadRealAnalytics = async () => {
    try {
      setLoading(true);
      const systemAnalytics = await analyticsService.getSystemAnalytics();
      setRealTimeData(systemAnalytics);
    } catch (error) {
      console.error('ERROR: Error loading real analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      const days = parseInt(timeRange);

      // Fetch double the window so we can derive the current window AND the
      // immediately-preceding window of equal length (for real % deltas).
      const [reportsFull, revenueFull] = await Promise.all([
        analyticsService.getTimeSeriesData('reports', days * 2),
        analyticsService.getTimeSeriesData('revenue', days * 2)
      ]);

      const reportsSeries = reportsFull.slice(-days);
      const revenueSeries = revenueFull.slice(-days);
      const reportsPrev = reportsFull.slice(0, days);
      const revenuePrev = revenueFull.slice(0, days);

      const reportsGenerated = sumSeries(reportsSeries);
      const totalRevenue = sumSeries(revenueSeries);
      const prevReports = sumSeries(reportsPrev);
      const prevRevenue = sumSeries(revenuePrev);

      const currentAnalytics = realTimeData || analytics || {};
      const activeClinics = currentAnalytics.activeClinics ?? analytics?.activeClinics ?? 0;
      const avgReports = activeClinics ? Math.round(reportsGenerated / activeClinics) : 0;
      const prevAvg = activeClinics ? Math.round(prevReports / activeClinics) : 0;

      setMetrics({
        totalRevenue,
        reportsGenerated,
        activeClinics,
        avgReports,
        revenueChange: pctChange(totalRevenue, prevRevenue),
        reportsChange: pctChange(reportsGenerated, prevReports),
        avgChange: pctChange(avgReports, prevAvg),
        clinicsChange: currentAnalytics.recentClinicGrowth?.growthRate ?? 0
      });

      setChartData({
        reportsOverTime: reportsSeries,
        revenueOverTime: revenueSeries
      });
    } catch (error) {
      console.error('Error generating chart data:', error);
    }
  };

  // "Active Clinics" card is windowed to the selected range (clinics onboarded
  // in the period) so it updates with the 7/30/90-day filter like the other
  // cards. The live total (metrics.activeClinics) is still used as the
  // denominator for Avg. Reports/Clinic so that stat stays meaningful.
  const dayMs = 24 * 60 * 60 * 1000;
  const windowDays = parseInt(timeRange);
  const now = Date.now();
  const windowStart = now - windowDays * dayMs;
  const prevWindowStart = now - windowDays * 2 * dayMs;
  const createdAtMs = (c) => (c.createdAt ? new Date(c.createdAt).getTime() : NaN);
  const clinicsInWindow = clinics.filter(c => createdAtMs(c) >= windowStart).length;
  const clinicsPrevWindow = clinics.filter(c => {
    const t = createdAtMs(c);
    return t >= prevWindowStart && t < windowStart;
  }).length;
  const clinicsWindowChange = pctChange(clinicsInWindow, clinicsPrevWindow);

  // Clinic status distribution, derived live from the loaded clinics.
  const clinicDistribution = [
    { name: 'Active Clinics', value: clinics.filter(c => c.isActive && c.subscriptionStatus !== 'trial').length, color: '#3B82F6' },
    { name: 'Trial Clinics', value: clinics.filter(c => c.subscriptionStatus === 'trial').length, color: '#F59E0B' },
    { name: 'Inactive Clinics', value: clinics.filter(c => !c.isActive).length, color: '#EF4444' }
  ];

  // Export the dashboard as a printable PDF (browser "Save as PDF").
  const exportData = () => {
    // Escape any DB-sourced text before injecting into the print window's HTML.
    const esc = (v) => String(v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const money = (v) => `$${(Number(v) || 0).toLocaleString()}`;
    const rangeLabel = RANGE_LABELS[timeRange] || `Last ${timeRange} days`;
    const generatedAt = new Date().toLocaleString();

    const metricRows = [
      ['Total Revenue', money(metrics.totalRevenue), fmtPct(metrics.revenueChange)],
      ['Active Clinics', metrics.activeClinics, fmtPct(metrics.clinicsChange)],
      ['Reports Generated', metrics.reportsGenerated, fmtPct(metrics.reportsChange)],
      ['Avg. Reports/Clinic', metrics.avgReports, fmtPct(metrics.avgChange)]
    ];

    const topClinics = [...clinics]
      .sort((a, b) => (b.reportsUsed || 0) - (a.reportsUsed || 0))
      .slice(0, 5);

    const activeSubs = clinics.filter(c => c.subscriptionStatus === 'active').length;
    const trialUsers = clinics.filter(c => c.subscriptionStatus === 'trial').length;
    const expiredTrials = clinics.filter(c => c.subscriptionStatus === 'expired').length;

    const row = (cells, tag = 'td') =>
      `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;

    const html = `<!doctype html><html><head><meta charset="utf-8" />
      <title>Neuro360 Analytics - ${generatedAt}</title>
      <style>
        * { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        body { margin: 32px; color: #1f2937; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        h2 { font-size: 15px; margin: 28px 0 8px; color: #4338ca; }
        .sub { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
        th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
        td.num, th.num { text-align: right; }
        @media print { body { margin: 12mm; } button { display: none; } }
      </style></head><body>
      <h1>Neuro360 &mdash; Analytics &amp; Reports</h1>
      <div class="sub">Range: ${rangeLabel} &nbsp;&bull;&nbsp; Generated: ${generatedAt}</div>

      <h2>Key Metrics</h2>
      <table>
        <thead>${row(['Metric', 'Value', 'Change vs previous period'], 'th')}</thead>
        <tbody>${metricRows.map(r => row([r[0], `<b>${r[1]}</b>`, r[2]])).join('')}</tbody>
      </table>

      <h2>Top Performing Clinics</h2>
      <table>
        <thead>${row(['#', 'Clinic', 'Email', 'Reports', '% Used'], 'th')}</thead>
        <tbody>${topClinics.map((c, i) => row([
          i + 1,
          esc(c.name) || '-',
          esc(c.email) || '-',
          c.reportsUsed || 0,
          `${(((c.reportsUsed || 0) / (c.reportsAllowed || 10)) * 100).toFixed(0)}%`
        ])).join('')}</tbody>
      </table>

      <h2>Usage Statistics</h2>
      <table>
        <tbody>
          ${row(['Active Subscriptions', activeSubs])}
          ${row(['Trial Users', trialUsers])}
          ${row(['Expired Trials', expiredTrials])}
          ${row(['Total Reports', metrics.reportsGenerated])}
          ${row(['Monthly Revenue', money(metrics.totalRevenue)])}
          ${row(['Avg. Revenue/Clinic', money(metrics.activeClinics ? Math.round(metrics.totalRevenue / metrics.activeClinics) : 0)])}
          ${row(['Revenue Growth', fmtPct(metrics.revenueChange)])}
        </tbody>
      </table>
      <script>window.onload = function () { window.print(); };</script>
      </body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      console.error('Popup blocked — unable to open print window for PDF export');
      alert('Please allow pop-ups for this site to export the analytics PDF.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-100 p-6 space-y-8">
      {/* Modern Analytics Header */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-xl text-slate-600 font-medium">
                Comprehensive insights into platform usage and revenue growth
              </p>
              <div className="flex items-center space-x-4 text-sm text-slate-500 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Real-time Analytics</span>
                </div>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Data Insights</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <button
                onClick={exportData}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center space-x-3">
                  <Download className="h-6 w-6" />
                  <span>Export PDF</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${(metrics.totalRevenue || 0).toLocaleString()}`}
          change={fmtPct(metrics.revenueChange)}
          changeType={metrics.revenueChange >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Active Clinics"
          value={clinicsInWindow}
          change={fmtPct(clinicsWindowChange)}
          changeType={clinicsWindowChange >= 0 ? 'positive' : 'negative'}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Reports Generated"
          value={metrics.reportsGenerated || 0}
          change={fmtPct(metrics.reportsChange)}
          changeType={metrics.reportsChange >= 0 ? 'positive' : 'negative'}
          icon={FileText}
          color="purple"
        />
        <MetricCard
          title="Avg. Reports/Clinic"
          value={metrics.avgReports || 0}
          change={fmtPct(metrics.avgChange)}
          changeType={metrics.avgChange >= 0 ? 'positive' : 'negative'}
          icon={Activity}
          color="yellow"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reports Over Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reports Generated</h3>
              <p className="text-sm text-gray-600">Daily report creation over time</p>
            </div>
            <BarChart3 className="h-6 w-6 text-gray-400" />
          </div>
          <div className="h-64 w-full bg-gray-50 rounded-lg p-2">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.reportsOverTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={(d) => (d || '').slice(5)} fontSize={11} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} width={32} />
                  <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="reports" name="Reports" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-600">Daily revenue over time</p>
            </div>
            <TrendingUp className="h-6 w-6 text-gray-400" />
          </div>
          <div className="h-64 w-full bg-gray-50 rounded-lg p-2">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.revenueOverTime} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={(d) => (d || '').slice(5)} fontSize={11} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Clinic Distribution and Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clinic Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clinic Status</h3>
              <p className="text-sm text-gray-600">Distribution by status</p>
            </div>
            <PieChart className="h-6 w-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {clinicDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Clinics */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Clinics</h3>
              <p className="text-sm text-gray-600">Clinics by report usage</p>
            </div>
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {clinics
              .sort((a, b) => (b.reportsUsed || 0) - (a.reportsUsed || 0))
              .slice(0, 5)
              .map((clinic, index) => (
                <div key={clinic.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-primary-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                      <div className="text-sm text-gray-500">{clinic.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {clinic.reportsUsed || 0} reports
                    </div>
                    <div className="text-sm text-gray-500">
                      {((clinic.reportsUsed || 0) / (clinic.reportsAllowed || 10) * 100).toFixed(0)}% used
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
            <p className="text-sm text-gray-600">Detailed breakdown of platform usage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Subscription Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Subscriptions</span>
                <span className="font-medium">
                  {clinics.filter(c => c.subscriptionStatus === 'active').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trial Users</span>
                <span className="font-medium">
                  {clinics.filter(c => c.subscriptionStatus === 'trial').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expired Trials</span>
                <span className="font-medium">
                  {clinics.filter(c => c.subscriptionStatus === 'expired').length}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Report Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Reports</span>
                <span className="font-medium">{reports.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium">
                  {reports.filter(r => {
                    const reportDate = new Date(r.created_at);
                    const now = new Date();
                    return reportDate.getMonth() === now.getMonth() &&
                           reportDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">This Week</span>
                <span className="font-medium">
                  {reports.filter(r => {
                    const reportDate = new Date(r.created_at);
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return reportDate >= weekAgo;
                  }).length}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Financial Overview</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-medium">${(metrics.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg. Revenue/Clinic</span>
                <span className="font-medium">
                  ${metrics.activeClinics ? Math.round((metrics.totalRevenue || 0) / metrics.activeClinics).toLocaleString() : 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenue Growth</span>
                <span className={`font-medium ${metrics.revenueChange >= 0 ? 'text-[#323956]' : 'text-red-600'}`}>
                  {fmtPct(metrics.revenueChange)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-[#323956]',
    blue: 'bg-[#CAE0FF] text-[#323956]',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <div className="flex items-center mt-2">
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-[#323956]' : 'text-red-600'
            }`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs previous period</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
