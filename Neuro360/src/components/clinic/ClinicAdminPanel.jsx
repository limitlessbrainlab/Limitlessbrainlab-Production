import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  FileText,
  UserCheck,
  Clock,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Lock,
  Unlock,
  Calendar,
  Activity,
  ChevronDown,
  ChevronUp,
  Download,
  Brain,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const ClinicAdminPanel = ({ clinicId, clinic }) => {
  const [activeTab, setActiveTab] = useState('patients');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Data states
  const [patients, setPatients] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState([]);
  const [assessmentAccess, setAssessmentAccess] = useState([]);
  const [coachAssignments, setCoachAssignments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    if (clinicId) {
      loadAllData();
    }
  }, [clinicId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPatients(),
        loadPaymentStatus(),
        loadAssessmentAccess(),
        loadCoachAssignments(),
        loadActivityLogs()
      ]);
    } catch (error) {
      console.error('Error loading clinic data:', error);
      toast.error('Failed to load some data');
    } finally {
      setLoading(false);
    }
  };

  // 1. Load Patient List
  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, email, phone, external_id, created_at, address, is_active')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  // 2. Load Payment/Unlock Status
  const loadPaymentStatus = async () => {
    try {
      // Get patients with their subscription/payment status
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          name,
          email,
          external_id,
          subscription_status,
          subscription_tier,
          reports_unlocked,
          dashboard_access,
          created_at
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentStatus(data || []);
    } catch (error) {
      console.error('Error loading payment status:', error);
    }
  };

  // 3. Load Assessment Access
  const loadAssessmentAccess = async () => {
    try {
      // Get assessment/report access logs
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          id,
          patient_id,
          action,
          resource_type,
          resource_id,
          access_granted,
          accessed_at,
          patients:patient_id (name, email, external_id)
        `)
        .eq('resource_type', 'report')
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) {
        // If access_logs doesn't exist, try alternative
        setAssessmentAccess([]);
        return;
      }

      // Filter by clinic patients
      const clinicPatientIds = patients.map(p => p.id);
      const filteredData = (data || []).filter(log =>
        clinicPatientIds.includes(log.patient_id)
      );

      setAssessmentAccess(filteredData);
    } catch (error) {
      console.error('Error loading assessment access:', error);
      setAssessmentAccess([]);
    }
  };

  // 4. Load Coach Assignments
  const loadCoachAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('coach_connection_requests')
        .select(`
          id,
          patient_id,
          patient_name,
          patient_email,
          coach_id,
          request_type,
          status,
          created_at,
          coaches:coach_id (name, email, specialties)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also get coaching sessions
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          id,
          patient_id,
          coach_id,
          scheduled_at,
          status,
          session_type,
          coaches:coach_id (name)
        `)
        .order('scheduled_at', { ascending: false });

      // Combine data
      setCoachAssignments({
        requests: data || [],
        sessions: sessions || []
      });
    } catch (error) {
      console.error('Error loading coach assignments:', error);
      setCoachAssignments({ requests: [], sessions: [] });
    }
  };

  // 5. Load Activity Logs
  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`entity_type.eq.patient,entity_type.eq.report,entity_type.eq.assessment`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        // Try usage table as fallback
        const { data: usageData } = await supabase
          .from('usage')
          .select('*')
          .eq('clinic_id', clinicId)
          .order('timestamp', { ascending: false })
          .limit(200);

        setActivityLogs(usageData || []);
        return;
      }

      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      setActivityLogs([]);
    }
  };

  // Filter patients by search term
  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.external_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Stats calculation
  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.is_active !== false).length,
    unlockedReports: paymentStatus.filter(p => p.reports_unlocked || p.dashboard_access).length,
    pendingCoachRequests: coachAssignments.requests?.filter(r => r.status === 'pending').length || 0
  };

  const tabs = [
    { id: 'patients', label: 'Patient List', icon: Users, count: stats.totalPatients },
    { id: 'payments', label: 'Payment Status', icon: CreditCard, count: stats.unlockedReports },
    { id: 'assessments', label: 'Assessment Access', icon: FileText, count: assessmentAccess.length },
    { id: 'coaches', label: 'Coach Assignments', icon: UserCheck, count: stats.pendingCoachRequests },
    { id: 'activity', label: 'Activity Logs', icon: Clock, count: activityLogs.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={stats.totalPatients}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Active Patients"
          value={stats.activePatients}
          color="green"
        />
        <StatCard
          icon={Unlock}
          label="Reports Unlocked"
          value={stats.unlockedReports}
          color="purple"
        />
        <StatCard
          icon={UserCheck}
          label="Pending Coach Requests"
          value={stats.pendingCoachRequests}
          color="orange"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#323956] text-[#323956] dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-[#323956] text-white dark:bg-blue-500'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#323956]"
            />
          </div>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {loading ? (
            <LoadingState />
          ) : (
            <>
              {activeTab === 'patients' && (
                <PatientListTab patients={filteredPatients} />
              )}
              {activeTab === 'payments' && (
                <PaymentStatusTab data={paymentStatus} searchTerm={searchTerm} />
              )}
              {activeTab === 'assessments' && (
                <AssessmentAccessTab data={assessmentAccess} />
              )}
              {activeTab === 'coaches' && (
                <CoachAssignmentsTab data={coachAssignments} />
              )}
              {activeTab === 'activity' && (
                <ActivityLogsTab data={activityLogs} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
};

// Loading State
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">Loading data...</p>
    </div>
  </div>
);

// 1. Patient List Tab
const PatientListTab = ({ patients }) => {
  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No patients found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registered</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {patients.map((patient) => (
            <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#323956] flex items-center justify-center text-white text-sm font-medium">
                    {patient.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{patient.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{patient.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {patient.external_id || '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {patient.phone || '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {patient.created_at ? new Date(patient.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hour12: true }) : '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  patient.is_active !== false
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {patient.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 2. Payment Status Tab
const PaymentStatusTab = ({ data, searchTerm }) => {
  const filtered = data.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No payment data found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Subscription</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reports</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dashboard</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((patient) => (
            <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{patient.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{patient.email}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {patient.external_id || '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  patient.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : patient.subscription_status === 'trial'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {patient.subscription_status || 'None'}
                  {patient.subscription_tier && ` (${patient.subscription_tier})`}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-1">
                  {patient.reports_unlocked ? (
                    <>
                      <Unlock className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Unlocked</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Locked</span>
                    </>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-1">
                  {patient.dashboard_access ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Disabled</span>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 3. Assessment Access Tab
const AssessmentAccessTab = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No assessment access logs found</p>
        <p className="text-xs text-gray-400 mt-2">Access logs will appear here when patients view their reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((log) => (
        <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className={`p-2 rounded-lg ${
            log.access_granted
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {log.access_granted ? <Eye className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 dark:text-white">
                {log.patients?.name || 'Unknown Patient'}
              </p>
              <span className="text-xs text-gray-500">
                {log.accessed_at ? new Date(log.accessed_at).toLocaleString() : '-'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {log.action} - {log.resource_type}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {log.patients?.email} ({log.patients?.external_id})
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// 4. Coach Assignments Tab
const CoachAssignmentsTab = ({ data }) => {
  const { requests = [], sessions = [] } = data;

  return (
    <div className="space-y-6">
      {/* Connection Requests */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <UserCheck className="h-4 w-4" />
          <span>Connection Requests</span>
        </h4>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No connection requests</p>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#323956] flex items-center justify-center text-white text-xs">
                    {request.patient_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{request.patient_name}</p>
                    <p className="text-xs text-gray-500">
                      Coach: {request.coaches?.name || 'Unknown'} | Type: {request.request_type}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : request.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coaching Sessions */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Coaching Sessions</span>
        </h4>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No coaching sessions scheduled</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {session.session_type || 'Session'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Coach: {session.coaches?.name} | {new Date(session.scheduled_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  session.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : session.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 5. Activity Logs Tab
const ActivityLogsTab = ({ data }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActionIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'REGISTER':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
      case 'EDIT':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'VIEW':
      case 'VIEW_REPORT':
      case 'VIEW_DASHBOARD':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'DOWNLOAD':
        return <Download className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No activity logs found</p>
        <p className="text-xs text-gray-400 mt-2">Activity logs will appear here as actions are performed</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 50).map((log) => (
        <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            onClick={() => toggleExpand(log.id)}
          >
            <div className="flex items-center space-x-3">
              {getActionIcon(log.action)}
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {log.action} - {log.entity_type || log.resource_type || 'System'}
                </p>
                <p className="text-xs text-gray-500">
                  {log.user_email || 'System'} | {new Date(log.created_at || log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                log.status === 'success' || log.severity === 'info'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : log.status === 'failure' || log.severity === 'error'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {log.status || log.severity || 'info'}
              </span>
              {expanded[log.id] ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          {expanded[log.id] && (
            <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                {log.description && <p><strong>Description:</strong> {log.description}</p>}
                {log.entity_id && <p><strong>Entity ID:</strong> {log.entity_id}</p>}
                {log.ip_address && <p><strong>IP Address:</strong> {log.ip_address}</p>}
                {log.user_role && <p><strong>User Role:</strong> {log.user_role}</p>}
                {log.metadata && (
                  <p><strong>Metadata:</strong> {JSON.stringify(log.metadata)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {data.length > 50 && (
        <p className="text-center text-sm text-gray-500 py-2">
          Showing 50 of {data.length} logs
        </p>
      )}
    </div>
  );
};

export default ClinicAdminPanel;
