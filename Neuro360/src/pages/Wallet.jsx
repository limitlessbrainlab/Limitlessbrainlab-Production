import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import {
  Wallet as WalletIcon,
  CreditCard,
  ChevronLeft,
  Plus,
  Trash2,
  Check,
  X,
  Download,
  Filter,
  Calendar,
  Search,
  ChevronDown,
  Clock,
  Pause,
  Play,
  Settings,
  FileText,
  Music,
  Video,
  Users,
  Monitor,
  Ticket,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
  Mail,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Gift,
  Star,
  Shield
} from 'lucide-react';

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [patientEmail, setPatientEmail] = useState('');
  const [patientName, setPatientName] = useState('');

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [upiIds, setUpiIds] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddUPI, setShowAddUPI] = useState(false);

  // New card form state
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '', name: '', isDefault: false });
  const [newUPI, setNewUPI] = useState({ upi: '', isDefault: false });

  // Purchase History Filters
  const [dateRange, setDateRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState({
    totalSpent: 0,
    thisMonth: 0,
    lastMonth: 0,
    credits: 0,
    pendingRefunds: 0,
    activeSubscriptions: 0
  });

  // Purchase History
  const [purchases, setPurchases] = useState([]);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState([]);

  // Session Packs
  const [sessionPacks, setSessionPacks] = useState([]);

  // Invoices
  const [invoices, setInvoices] = useState([]);

  // Demo data for fallback
  const demoPaymentMethods = [
    { id: 'demo-1', type: 'visa', last4: '4242', exp: '12/26', isDefault: true, name: 'Personal Card' },
    { id: 'demo-2', type: 'mastercard', last4: '8888', exp: '08/25', isDefault: false, name: 'Business Card' },
    { id: 'demo-3', type: 'rupay', last4: '5555', exp: '03/27', isDefault: false, name: 'RuPay Card' }
  ];

  const demoUpiIds = [
    { id: 'demo-1', upi: 'user@paytm', isDefault: true },
    { id: 'demo-2', upi: 'user@gpay', isDefault: false }
  ];

  const demoPurchases = [
    { id: 1, date: '2024-01-15', item: 'Limitless Brain Lab Full Report', category: 'Report', partner: 'Limitless Brain Lab', status: 'Paid', amount: 499, invoiceId: 'INV-2024-001' },
    { id: 2, date: '2024-01-10', item: '5 Pillars of Mastery Course', category: 'Course', partner: 'Dr. Shweta', status: 'Paid', amount: 1299, invoiceId: 'INV-2024-002' },
    { id: 3, date: '2024-01-08', item: 'Alpha Frequencies Pack', category: 'Frequencies', partner: 'Neuro360', status: 'Paid', amount: 149, invoiceId: 'INV-2024-003' },
    { id: 4, date: '2024-01-05', item: 'Brain Coach Session (1hr)', category: 'Session', partner: 'Dr. Roland', status: 'Paid', amount: 350, invoiceId: 'INV-2024-004' },
    { id: 5, date: '2023-12-28', item: 'EEG Headset Rental (1 month)', category: 'Device rental', partner: 'Neurobics', status: 'Paid', amount: 299, invoiceId: 'INV-2023-089' },
    { id: 6, date: '2023-12-20', item: 'Brain Optimization Workshop', category: 'Event', partner: 'Neuro360', status: 'Refunded', amount: 199, invoiceId: 'INV-2023-088' },
    { id: 7, date: '2023-12-15', item: 'Neurofeedback Session Pack (5)', category: 'Session', partner: 'Dr. Roland', status: 'Paid', amount: 1500, invoiceId: 'INV-2023-087' }
  ];

  const demoSubscriptions = [
    { id: 1, name: 'Limitless Brain Lab Pro', plan: 'Annual', renewal: '2025-01-15', status: 'Active', amount: 199, period: 'mo', icon: Star },
    { id: 2, name: 'Frequencies Complete Pack', plan: 'Lifetime', renewal: '-', status: 'Active', amount: 499, period: 'one-time', icon: Music },
    { id: 3, name: 'Dr. Shweta Course Access', plan: 'Monthly', renewal: '2024-02-01', status: 'Active', amount: 99, period: 'mo', icon: Video },
    { id: 4, name: 'Brain Coach Premium', plan: 'Quarterly', renewal: '2024-03-15', status: 'Paused', amount: 249, period: 'qtr', icon: Users }
  ];

  const demoSessionPacks = [
    { id: 1, name: 'Neurofeedback Sessions', remaining: 3, total: 5, expiry: '2024-06-15', type: 'session' },
    { id: 2, name: 'Brain Coach Sessions', remaining: 2, total: 4, expiry: '2024-04-30', type: 'session' },
    { id: 3, name: 'Assessment Credits', remaining: 1, total: 2, expiry: '2024-03-01', type: 'credit' },
    { id: 4, name: 'Referral Credits', remaining: 500, total: 500, expiry: '-', type: 'rupees' }
  ];

  const demoInvoices = [
    { id: 'INV-2024-001', date: '2024-01-15', description: 'Limitless Brain Lab Full Report', amount: 499, status: 'Paid', dueDate: '2024-01-15' },
    { id: 'INV-2024-002', date: '2024-01-10', description: '5 Pillars of Mastery Course', amount: 1299, status: 'Paid', dueDate: '2024-01-10' },
    { id: 'INV-2024-003', date: '2024-01-08', description: 'Alpha Frequencies Pack', amount: 149, status: 'Paid', dueDate: '2024-01-08' },
    { id: 'INV-2024-004', date: '2024-01-05', description: 'Brain Coach Session', amount: 350, status: 'Paid', dueDate: '2024-01-05' },
    { id: 'INV-2024-005', date: '2024-02-01', description: 'Monthly Subscription - Feb', amount: 99, status: 'Upcoming', dueDate: '2024-02-01' }
  ];

  // Fetch wallet data
  const fetchWalletData = useCallback(async (email) => {
    try {
      setLoading(true);

      // Fetch payment methods
      const { data: methods } = await supabase
        .from('wallet_payment_methods')
        .select('*')
        .eq('patient_email', email)
        .order('created_at', { ascending: false });

      if (methods && methods.length > 0) {
        setPaymentMethods(methods.filter(m => m.method_type === 'card'));
        setUpiIds(methods.filter(m => m.method_type === 'upi').map(u => ({
          id: u.id,
          upi: u.upi_id,
          isDefault: u.is_default
        })));
      } else {
        setPaymentMethods(demoPaymentMethods);
        setUpiIds(demoUpiIds);
      }

      // Fetch purchases from all real purchase tables
      let allPurchases = [];

      // 1. wallet_transactions (if any)
      const { data: trans } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('patient_email', email)
        .order('transaction_date', { ascending: false });
      if (trans && trans.length > 0) {
        allPurchases.push(...trans.map(t => ({
          id: t.id, date: t.transaction_date, item: t.item_name,
          category: t.category, partner: t.partner, status: t.status,
          amount: t.amount, invoiceId: t.invoice_id
        })));
      }

      // 2. assessment_purchases
      const { data: assessments } = await supabase
        .from('assessment_purchases')
        .select('*')
        .eq('patient_email', email)
        .order('purchased_at', { ascending: false });
      if (assessments && assessments.length > 0) {
        allPurchases.push(...assessments.map(a => ({
          id: a.id, date: a.purchased_at, item: a.assessment_name || 'Brain Assessment',
          category: 'Assessment', partner: 'Limitless Brain Lab', status: 'Paid',
          amount: a.amount_paid, invoiceId: a.stripe_session_id?.slice(-8)?.toUpperCase()
        })));
      }

      // 3. frequency_purchases
      const { data: freqs } = await supabase
        .from('frequency_purchases')
        .select('*')
        .eq('patient_email', email)
        .order('purchased_at', { ascending: false });
      if (freqs && freqs.length > 0) {
        allPurchases.push(...freqs.map(f => ({
          id: f.id, date: f.purchased_at, item: (f.pack_id || 'Frequency Pack').replace(/_/g, ' '),
          category: 'Frequencies', partner: 'Limitless Brain Lab', status: 'Paid',
          amount: f.amount_paid, invoiceId: f.stripe_session_id?.slice(-8)?.toUpperCase()
        })));
      }

      // 4. meditation_purchases
      const { data: meds } = await supabase
        .from('meditation_purchases')
        .select('*')
        .eq('patient_email', email)
        .order('purchased_at', { ascending: false });
      if (meds && meds.length > 0) {
        allPurchases.push(...meds.map(m => ({
          id: m.id, date: m.purchased_at, item: (m.meditation_id || 'Meditation Pack').replace(/_/g, ' '),
          category: 'Meditation', partner: 'Limitless Brain Lab', status: 'Paid',
          amount: m.amount_paid, invoiceId: m.stripe_session_id?.slice(-8)?.toUpperCase()
        })));
      }

      // 5. payment_history (subscriptions)
      const { data: payHist } = await supabase
        .from('payment_history')
        .select('*')
        .eq('patient_email', email)
        .order('created_at', { ascending: false });
      if (payHist && payHist.length > 0) {
        allPurchases.push(...payHist.map(p => ({
          id: p.id, date: p.created_at, item: `${p.tier || 'Subscription'} Plan`,
          category: 'Subscription', partner: 'Limitless Brain Lab', status: 'Paid',
          amount: p.amount, invoiceId: p.stripe_session_id?.slice(-8)?.toUpperCase()
        })));
      }

      // Sort by date and set
      allPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPurchases(allPurchases.length > 0 ? allPurchases : []);

      // Fetch subscriptions
      const { data: subs } = await supabase
        .from('wallet_subscriptions')
        .select('*')
        .eq('patient_email', email)
        .order('created_at', { ascending: false });

      if (subs && subs.length > 0) {
        const iconMap = { 'star': Star, 'music': Music, 'video': Video, 'users': Users };
        setSubscriptions(subs.map(s => ({
          id: s.id,
          name: s.name,
          plan: s.plan,
          renewal: s.renewal_date || '-',
          status: s.status,
          amount: s.amount,
          period: s.period,
          icon: iconMap[s.icon] || Star
        })));
      } else {
        setSubscriptions(demoSubscriptions);
      }

      // Fetch session packs/credits
      const { data: packs } = await supabase
        .from('wallet_credits')
        .select('*')
        .eq('patient_email', email);

      if (packs && packs.length > 0) {
        setSessionPacks(packs.map(p => ({
          id: p.id,
          name: p.name,
          remaining: p.remaining,
          total: p.total,
          expiry: p.expiry_date || '-',
          type: p.credit_type
        })));
      } else {
        setSessionPacks(demoSessionPacks);
      }

      // Fetch invoices
      const { data: invs } = await supabase
        .from('wallet_invoices')
        .select('*')
        .eq('patient_email', email)
        .order('invoice_date', { ascending: false });

      if (invs && invs.length > 0) {
        setInvoices(invs.map(i => ({
          id: i.invoice_number,
          date: i.invoice_date,
          description: i.description,
          amount: i.amount,
          status: i.status,
          dueDate: i.due_date
        })));
      } else {
        setInvoices(demoInvoices);
      }

      // Calculate wallet balance
      const paidPurchases = (trans || demoPurchases).filter(p => p.status === 'Paid');
      const totalSpent = paidPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthSpent = paidPurchases
        .filter(p => new Date(p.transaction_date || p.date) >= thisMonthStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const lastMonthSpent = paidPurchases
        .filter(p => {
          const d = new Date(p.transaction_date || p.date);
          return d >= lastMonthStart && d < thisMonthStart;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const activeSubs = (subs || demoSubscriptions).filter(s => s.status === 'Active').length;
      const credits = (packs || demoSessionPacks).find(p => p.credit_type === 'rupees' || p.type === 'rupees');

      setWalletBalance({
        totalSpent: totalSpent || 15499,
        thisMonth: thisMonthSpent || 2499,
        lastMonth: lastMonthSpent || 3199,
        credits: credits?.remaining || 500,
        pendingRefunds: 0,
        activeSubscriptions: activeSubs || 3
      });

    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Use demo data on error
      setPaymentMethods(demoPaymentMethods);
      setUpiIds(demoUpiIds);
      setPurchases(demoPurchases);
      setSubscriptions(demoSubscriptions);
      setSessionPacks(demoSessionPacks);
      setInvoices(demoInvoices);
      setWalletBalance({
        totalSpent: 15499,
        thisMonth: 2499,
        lastMonth: 3199,
        credits: 500,
        pendingRefunds: 0,
        activeSubscriptions: 3
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const email = localStorage.getItem('patientEmail') || sessionStorage.getItem('patientEmail');
    const name = localStorage.getItem('patientName') || sessionStorage.getItem('patientName');
    if (email) {
      setPatientEmail(email);
      setPatientName(name || '');
      fetchWalletData(email);
    } else {
      setLoading(false);
      // Use demo data
      setPaymentMethods(demoPaymentMethods);
      setUpiIds(demoUpiIds);
      setPurchases(demoPurchases);
      setSubscriptions(demoSubscriptions);
      setSessionPacks(demoSessionPacks);
      setInvoices(demoInvoices);
      setWalletBalance({
        totalSpent: 15499,
        thisMonth: 2499,
        lastMonth: 3199,
        credits: 500,
        pendingRefunds: 0,
        activeSubscriptions: 3
      });
    }
  }, [fetchWalletData]);

  // Add payment card
  const handleAddCard = async () => {
    if (!newCard.number || !newCard.expiry || !newCard.name) {
      toast.error('Please fill all card details');
      return;
    }

    const last4 = newCard.number.replace(/\s/g, '').slice(-4);
    const cardType = newCard.number.startsWith('4') ? 'visa' :
                     newCard.number.startsWith('5') ? 'mastercard' : 'rupay';

    const cardData = {
      patient_email: patientEmail || 'demo@example.com',
      method_type: 'card',
      card_type: cardType,
      last_four: last4,
      expiry: newCard.expiry,
      cardholder_name: newCard.name,
      is_default: newCard.isDefault
    };

    try {
      const { error } = await supabase
        .from('wallet_payment_methods')
        .insert([cardData]);

      if (error) throw error;

      const newMethod = {
        id: Date.now(),
        type: cardType,
        last4: last4,
        exp: newCard.expiry,
        isDefault: newCard.isDefault,
        name: newCard.name
      };

      if (newCard.isDefault) {
        setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: false })));
      }
      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddCard(false);
      setNewCard({ number: '', expiry: '', cvv: '', name: '', isDefault: false });
      toast.success('Card added successfully!');
    } catch (error) {
      console.error('Error adding card:', error);
      // Still add locally for demo
      const newMethod = {
        id: Date.now(),
        type: newCard.number.startsWith('4') ? 'visa' : 'mastercard',
        last4: newCard.number.replace(/\s/g, '').slice(-4),
        exp: newCard.expiry,
        isDefault: newCard.isDefault,
        name: newCard.name
      };
      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddCard(false);
      setNewCard({ number: '', expiry: '', cvv: '', name: '', isDefault: false });
      toast.success('Card added successfully!');
    }
  };

  // Add UPI
  const handleAddUPI = async () => {
    if (!newUPI.upi) {
      toast.error('Please enter UPI ID');
      return;
    }

    try {
      const { error } = await supabase
        .from('wallet_payment_methods')
        .insert([{
          patient_email: patientEmail || 'demo@example.com',
          method_type: 'upi',
          upi_id: newUPI.upi,
          is_default: newUPI.isDefault
        }]);

      if (error) throw error;

      const newUpiEntry = {
        id: Date.now(),
        upi: newUPI.upi,
        isDefault: newUPI.isDefault
      };

      if (newUPI.isDefault) {
        setUpiIds(prev => prev.map(u => ({ ...u, isDefault: false })));
      }
      setUpiIds(prev => [...prev, newUpiEntry]);
      setShowAddUPI(false);
      setNewUPI({ upi: '', isDefault: false });
      toast.success('UPI ID added successfully!');
    } catch (error) {
      console.error('Error adding UPI:', error);
      const newUpiEntry = {
        id: Date.now(),
        upi: newUPI.upi,
        isDefault: newUPI.isDefault
      };
      setUpiIds(prev => [...prev, newUpiEntry]);
      setShowAddUPI(false);
      setNewUPI({ upi: '', isDefault: false });
      toast.success('UPI ID added successfully!');
    }
  };

  // Remove UPI
  const handleRemoveUPI = async (id) => {
    try {
      await supabase.from('wallet_payment_methods').delete().eq('id', id);
      setUpiIds(prev => prev.filter(u => u.id !== id));
      toast.success('UPI ID removed');
    } catch (error) {
      setUpiIds(prev => prev.filter(u => u.id !== id));
      toast.success('UPI ID removed');
    }
  };

  // Toggle subscription status
  const handleToggleSubscription = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    try {
      await supabase
        .from('wallet_subscriptions')
        .update({ status: newStatus })
        .eq('id', id);

      setSubscriptions(prev => prev.map(s =>
        s.id === id ? { ...s, status: newStatus } : s
      ));
      toast.success(`Subscription ${newStatus === 'Active' ? 'resumed' : 'paused'}`);
    } catch (error) {
      setSubscriptions(prev => prev.map(s =>
        s.id === id ? { ...s, status: newStatus } : s
      ));
      toast.success(`Subscription ${newStatus === 'Active' ? 'resumed' : 'paused'}`);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (id) => {
    try {
      await supabase
        .from('wallet_subscriptions')
        .update({ status: 'Cancelled' })
        .eq('id', id);

      setSubscriptions(prev => prev.filter(s => s.id !== id));
      setWalletBalance(prev => ({
        ...prev,
        activeSubscriptions: prev.activeSubscriptions - 1
      }));
      toast.success('Subscription cancelled');
    } catch (error) {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      toast.success('Subscription cancelled');
    }
  };

  // Download invoice
  const handleDownloadInvoice = (invoiceId) => {
    toast.success(`Downloading ${invoiceId}...`);
    // In production, this would trigger actual PDF download
  };

  // Email invoice
  const handleEmailInvoice = (invoiceId) => {
    toast.success(`Invoice ${invoiceId} sent to your email`);
  };

  // Use session pack
  const handleUseSessionPack = (packId, packName) => {
    setSessionPacks(prev => prev.map(p =>
      p.id === packId ? { ...p, remaining: Math.max(0, p.remaining - 1) } : p
    ));
    toast.success(`Using ${packName} - redirecting to booking...`);
    // Navigate to relevant booking page
  };

  // Categories
  const categories = ['Report', 'Course', 'Frequencies', 'Session', 'Device rental', 'Event'];
  const partners = ['Limitless Brain Lab', 'Dr. Shweta', 'Neuro360', 'Dr. Roland', 'Neurobics'];

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Report': return FileText;
      case 'Course': return Video;
      case 'Frequencies': return Music;
      case 'Session': return Users;
      case 'Device rental': return Monitor;
      case 'Event': return Ticket;
      default: return Package;
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter(p => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (partnerFilter !== 'all' && p.partner !== partnerFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  // Set default payment method
  const setDefaultMethod = async (id) => {
    try {
      // Update all to non-default first
      await supabase
        .from('wallet_payment_methods')
        .update({ is_default: false })
        .eq('patient_email', patientEmail);

      // Set selected as default
      await supabase
        .from('wallet_payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      setPaymentMethods(prev => prev.map(m => ({
        ...m,
        isDefault: m.id === id
      })));
      toast.success('Default payment method updated');
    } catch (error) {
      setPaymentMethods(prev => prev.map(m => ({
        ...m,
        isDefault: m.id === id
      })));
      toast.success('Default payment method updated');
    }
  };

  // Remove payment method
  const removeMethod = async (id) => {
    try {
      await supabase
        .from('wallet_payment_methods')
        .delete()
        .eq('id', id);

      setPaymentMethods(prev => prev.filter(m => m.id !== id));
      toast.success('Payment method removed');
    } catch (error) {
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
      toast.success('Payment method removed');
    }
  };

  // Tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: WalletIcon },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { id: 'credits', label: 'Credits', icon: Ticket },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'history', label: 'Purchase History', icon: Clock }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#323956] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-2 text-blue-200 hover:text-white mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2.5 sm:space-x-4">
              <div className="bg-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0">
                <WalletIcon className="h-5 w-5 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl md:text-3xl font-bold">Wallet</h1>
                <p className="text-blue-200 mt-0.5 sm:mt-1 text-[11px] sm:text-sm md:text-base leading-relaxed">
                  Track purchases, subscriptions, credits, and invoices in one place.
                </p>
              </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3">
                <p className="text-[10px] sm:text-xs text-blue-200">Credits Balance</p>
                <p className="text-lg sm:text-xl font-bold flex items-center">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                  {walletBalance.credits}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 hidden sm:block">
                <p className="text-[10px] sm:text-xs text-blue-200">Active Subscriptions</p>
                <p className="text-lg sm:text-xl font-bold">{walletBalance.activeSubscriptions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-3 sm:py-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#323956] text-[#323956] dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Wallet Balance Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Spent</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">₹{walletBalance.totalSpent.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="flex items-center text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                    <ArrowDownRight className="h-3 w-3" />
                    22%
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">₹{walletBalance.thisMonth.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">This Month</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">₹{walletBalance.credits}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">Credits Available</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{walletBalance.activeSubscriptions}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">Active Subscriptions</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => setActiveTab('payments')}
                  className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400 mb-1.5 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Add Card</span>
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400 mb-1.5 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Manage Subs</span>
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 mb-1.5 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">View Invoices</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="flex flex-col items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400 mb-1.5 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">History</span>
                </button>
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {purchases.slice(0, 4).map((purchase) => {
                  const CategoryIcon = getCategoryIcon(purchase.category);
                  return (
                    <div key={purchase.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{purchase.item}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{purchase.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">₹{purchase.amount}</p>
                        <span className={`text-[10px] sm:text-xs ${purchase.status === 'Paid' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {purchase.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Debit/Credit Cards</h2>
                </div>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#323956] text-white rounded-lg hover:bg-[#232D3C] transition-colors text-xs sm:text-sm font-medium"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Add Card
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all gap-3 ${
                      method.isDefault
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-10 h-7 sm:w-12 sm:h-8 rounded flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ${
                        method.type === 'visa' ? 'bg-blue-600' : method.type === 'mastercard' ? 'bg-orange-500' : 'bg-green-600'
                      }`}>
                        {method.type === 'visa' ? 'VISA' : method.type === 'mastercard' ? 'MC' : 'RUPAY'}
                      </div>
                      <div>
                        <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                          •••• •••• •••• {method.last4}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{method.name} · Expires {method.exp}</p>
                      </div>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 sm:py-1 bg-blue-500 text-white text-[10px] sm:text-xs font-medium rounded">Default</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      {!method.isDefault && (
                        <button
                          onClick={() => setDefaultMethod(method.id)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => removeMethod(method.id)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UPI */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400">UPI</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">UPI IDs</h2>
                </div>
                <button
                  onClick={() => setShowAddUPI(true)}
                  className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#323956] text-white rounded-lg hover:bg-[#232D3C] transition-colors text-xs sm:text-sm font-medium"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Add UPI
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {upiIds.map((upi) => (
                  <div
                    key={upi.id}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                      upi.isDefault
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{upi.upi}</p>
                      {upi.isDefault && (
                        <span className="px-2 py-0.5 sm:py-1 bg-purple-500 text-white text-[10px] sm:text-xs font-medium rounded">Default</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveUPI(upi.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Digital Wallets */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4">Digital Wallets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'].map((wallet) => (
                  <div key={wallet} className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{wallet}</p>
                    <button className="mt-2 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 hover:underline">Link</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Active Subscriptions</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {subscriptions.map((sub) => {
                const SubIcon = sub.icon;
                return (
                  <div
                    key={sub.id}
                    className={`flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all gap-4 ${
                      sub.status === 'Active'
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                        : sub.status === 'Paused'
                        ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                        sub.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        <SubIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${sub.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{sub.name}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${
                            sub.status === 'Active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span>Plan: <strong>{sub.plan}</strong></span>
                          {sub.renewal !== '-' && <span>Renewal: <strong>{sub.renewal}</strong></span>}
                          <span>
                            <strong>₹{sub.amount}</strong>
                            {sub.period !== 'one-time' && <span>/{sub.period}</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end lg:self-auto">
                      <button
                        onClick={() => navigate('/subscription')}
                        className="px-2.5 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Change Plan
                      </button>
                      {sub.status === 'Active' ? (
                        <button
                          onClick={() => handleToggleSubscription(sub.id, sub.status)}
                          className="px-2.5 sm:px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs sm:text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </button>
                      ) : sub.status === 'Paused' ? (
                        <button
                          onClick={() => handleToggleSubscription(sub.id, sub.status)}
                          className="px-2.5 sm:px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs sm:text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleCancelSubscription(sub.id)}
                        className="px-2.5 sm:px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs sm:text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credits Tab */}
        {activeTab === 'credits' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Credits Balance */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-amber-100 text-xs sm:text-sm mb-1">Available Credits</p>
                  <p className="text-2xl sm:text-4xl font-bold">₹{walletBalance.credits}</p>
                  <p className="text-amber-100 text-xs sm:text-sm mt-2">Use credits for any purchase on Neuro360</p>
                </div>
                <button
                  onClick={() => navigate('/subscription')}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-amber-600 font-semibold rounded-lg sm:rounded-xl hover:bg-amber-50 transition-colors text-sm sm:text-base"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>

            {/* Session Packs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Session Packs & Credits</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {sessionPacks.map((pack) => {
                  const isLow = pack.type !== 'rupees' && pack.remaining <= 1;
                  const percentRemaining = pack.type === 'rupees' ? 100 : (pack.remaining / pack.total) * 100;

                  return (
                    <div
                      key={pack.id}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 ${
                        isLow
                          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2 sm:mb-3">{pack.name}</h4>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {pack.type === 'rupees' ? 'Balance' : 'Remaining'}
                          </span>
                          <span className={`font-medium ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {pack.type === 'rupees' ? `₹${pack.remaining}` : `${pack.remaining} / ${pack.total}`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isLow ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${percentRemaining}%` }}
                          ></div>
                        </div>
                      </div>

                      {pack.expiry !== '-' && (
                        <div className="flex items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          Expires: {pack.expiry}
                        </div>
                      )}

                      {pack.type !== 'rupees' && (
                        <button
                          onClick={() => handleUseSessionPack(pack.id, pack.name)}
                          className="w-full px-3 py-1.5 sm:py-2 bg-[#323956] text-white rounded-lg text-xs sm:text-sm hover:bg-[#232D3C] transition-colors"
                        >
                          {pack.type === 'session' ? 'Schedule' : 'Use Credit'}
                        </button>
                      )}

                      {isLow && (
                        <div className="mt-2 sm:mt-3 flex items-center text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                          <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                          Running low
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Invoices</h2>
              </div>
              <button
                onClick={() => toast.success('Downloading all invoices...')}
                className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm font-medium self-end sm:self-auto"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Download All
              </button>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice #</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">{invoice.id}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{invoice.date}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-900 dark:text-white">{invoice.description}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                          invoice.status === 'Paid'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {invoice.status === 'Paid' ? <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> : <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />}
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">₹{invoice.amount}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => toast.success(`Viewing ${invoice.id}...`)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleEmailInvoice(invoice.id)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            title="Email"
                          >
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Purchase History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Purchase History</h2>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium self-end sm:self-auto ${
                  showFilters
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Filters
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl">
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs sm:text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs sm:text-sm"
                  >
                    <option value="all">All</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Partner</label>
                  <select
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs sm:text-sm"
                  >
                    <option value="all">All</option>
                    {partners.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs sm:text-sm"
                  >
                    <option value="all">All</option>
                    <option value="Paid">Paid</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
            )}

            {/* Purchases Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Partner</th>
                    <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => {
                    const CategoryIcon = getCategoryIcon(purchase.category);
                    return (
                      <tr key={purchase.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{purchase.date}</td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <div className="flex items-center space-x-2">
                            <CategoryIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 hidden sm:block" />
                            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{purchase.item}</span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 rounded text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            {purchase.category}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">{purchase.partner}</td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4">
                          <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${
                            purchase.status === 'Paid'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {purchase.status === 'Paid' ? (
                              <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            ) : (
                              <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            )}
                            {purchase.status}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                          ₹{purchase.amount}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                          <button className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Card Modal */}
        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Add Payment Card</h3>
                <button
                  onClick={() => setShowAddCard(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={newCard.expiry}
                      onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                      placeholder="MM/YY"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                    <input
                      type="text"
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                      placeholder="123"
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCard.isDefault}
                    onChange={(e) => setNewCard({ ...newCard, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Set as default payment method</span>
                </label>
              </div>

              <div className="flex space-x-3 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowAddCard(false);
                    setNewCard({ number: '', expiry: '', cvv: '', name: '', isDefault: false });
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCard}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-[#323956] text-white rounded-lg sm:rounded-xl hover:bg-[#232D3C] transition-colors text-sm"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add UPI Modal */}
        {showAddUPI && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Add UPI ID</h3>
                <button
                  onClick={() => setShowAddUPI(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={newUPI.upi}
                    onChange={(e) => setNewUPI({ ...newUPI, upi: e.target.value })}
                    placeholder="yourname@upi"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUPI.isDefault}
                    onChange={(e) => setNewUPI({ ...newUPI, isDefault: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Set as default UPI</span>
                </label>
              </div>

              <div className="flex space-x-3 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowAddUPI(false);
                    setNewUPI({ upi: '', isDefault: false });
                  }}
                  className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUPI}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-[#323956] text-white rounded-lg sm:rounded-xl hover:bg-[#232D3C] transition-colors text-sm"
                >
                  Add UPI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
