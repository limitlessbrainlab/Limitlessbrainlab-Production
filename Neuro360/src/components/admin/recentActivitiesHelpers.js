import { Building2, FileText, Banknote } from 'lucide-react';

// Convert a real timestamp into a short relative-time label (e.g. "5 minutes
// ago"). Guards against missing/invalid dates by returning "".
export const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
};

export const getIconColor = (color) => {
  const colors = {
    blue: 'bg-[#323956]',
    green: 'bg-[#323956]',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };
  return colors[color] || 'bg-gray-500';
};

// Build the merged Recent Activities list from real clinic/report/payment rows.
// Each activity carries its raw `createdAt` so the combined list can be sorted
// by real timestamp (newest first). Pass `perTypeLimit` to cap how many rows of
// each type are considered (the dashboard widget uses a small cap; the full
// activities view passes none to include everything).
export const buildRecentActivities = (allClinics = [], allReports = [], allPayments = [], perTypeLimit) => {
  const cap = (arr) => (perTypeLimit ? arr.slice(0, perTypeLimit) : arr);
  const activities = [];

  // Recent clinics
  const recentClinics = cap(
    [...allClinics].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  recentClinics.forEach((clinic) => {
    activities.push({
      id: `clinic-${clinic.id}`,
      type: 'clinic',
      message: `New clinic "${clinic.name}" registered`,
      createdAt: clinic.createdAt,
      time: timeAgo(clinic.createdAt),
      icon: Building2,
      color: 'blue'
    });
  });

  // Recent reports
  const recentReports = cap(
    [...allReports].sort((a, b) => new Date(b.createdAt || b.uploadedAt) - new Date(a.createdAt || a.uploadedAt))
  );
  recentReports.forEach((report) => {
    const clinic = allClinics.find(c => c.id === report.clinicId);
    const reportDate = report.createdAt || report.uploadedAt;
    activities.push({
      id: `report-${report.id}`,
      type: 'report',
      message: `New report uploaded by ${clinic ? clinic.name : 'Unknown Clinic'}`,
      createdAt: reportDate,
      time: timeAgo(reportDate),
      icon: FileText,
      color: 'green'
    });
  });

  // Recent payments
  const recentPayments = cap(
    [...allPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  );
  recentPayments.forEach((payment) => {
    const clinic = allClinics.find(c => c.id === payment.clinicId);
    activities.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      message: `Payment of ₹${payment.amount} received from ${clinic ? clinic.name : 'Unknown Clinic'}`,
      createdAt: payment.createdAt,
      time: timeAgo(payment.createdAt),
      icon: Banknote,
      color: 'purple'
    });
  });

  // Sort the merged list by real timestamp, newest first.
  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return activities;
};
