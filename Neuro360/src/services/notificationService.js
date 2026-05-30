import { supabase } from '../lib/supabaseClient';

const TABLE = 'admin_notifications';

class NotificationService {
  constructor() {
    this.listeners = new Set();
    this.realtimeChannel = null;
  }

  // Subscribe to real-time notification changes
  startRealtime(onNewNotification) {
    if (this.realtimeChannel) return;

    this.realtimeChannel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE },
        (payload) => {
          const notification = this._toCamelCase(payload.new);
          onNewNotification?.(notification);
          this.listeners.forEach((fn) => fn(notification));
        }
      )
      .subscribe();
  }

  stopRealtime() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  addListener(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Fetch notifications with optional filters
  async getNotifications({ type, isRead, category, limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && type !== 'all') query = query.eq('type', type);
    if (isRead === true) query = query.eq('is_read', true);
    if (isRead === false) query = query.eq('is_read', false);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
    return (data || []).map(this._toCamelCase);
  }

  // Fetch notifications for a specific clinic
  async getClinicNotifications(clinicId, { limit = 20, isRead } = {}) {
    if (!clinicId) return [];
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (isRead === false) query = query.eq('is_read', false);
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching clinic notifications:', error);
      return [];
    }
    return (data || []).map(this._toCamelCase);
  }

  // Get unread count for a specific clinic
  async getClinicUnreadCount(clinicId) {
    if (!clinicId) return 0;
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_read', false);
    if (error) {
      console.error('Error fetching clinic unread count:', error);
      return 0;
    }
    return count || 0;
  }

  // Real-time subscription scoped to a specific clinic
  startClinicRealtime(clinicId, onNewNotification) {
    if (!clinicId) return () => {};
    const channelName = `clinic-notifications-${clinicId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE, filter: `clinic_id=eq.${clinicId}` },
        (payload) => {
          const notification = this._toCamelCase(payload.new);
          onNewNotification?.(notification);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }

  // Get unread count
  async getUnreadCount() {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
    return count || 0;
  }

  // Create a notification
  async create({ type = 'info', category = 'general', title, message, clinicId, clinicName, patientId, patientName, reportId, action, actionData, createdBy }) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        type,
        category,
        title,
        message,
        clinic_id: clinicId || null,
        clinic_name: clinicName || null,
        patient_id: patientId || null,
        patient_name: patientName || null,
        report_id: reportId || null,
        action: action || null,
        action_data: actionData || {},
        is_read: false,
        created_by: createdBy || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }
    return this._toCamelCase(data);
  }

  // Mark single notification as read
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) console.error('Error marking notification as read:', error);
    return !error;
  }

  // Mark all as read
  async markAllAsRead() {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('is_read', false);

    if (error) console.error('Error marking all notifications as read:', error);
    return !error;
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', notificationId);

    if (error) console.error('Error deleting notification:', error);
    return !error;
  }

  // ---- Convenience methods for specific events ----

  async notifyReportUploaded({ clinicId, clinicName, patientId, patientName, reportId, reportType, uploadedBy }) {
    return this.create({
      type: 'success',
      category: 'report_delivery',
      title: 'Report Uploaded',
      message: `${reportType || 'Report'} uploaded for ${patientName || 'patient'} at ${clinicName || 'clinic'} by ${uploadedBy || 'Admin'}.`,
      clinicId,
      clinicName,
      patientId,
      patientName,
      reportId,
      action: 'view_report',
      actionData: { reportType }
    });
  }

  async notifyReportEmailSent({ clinicName, patientName, patientEmail, reportType }) {
    return this.create({
      type: 'info',
      category: 'report_delivery',
      title: 'Report Notification Email Sent',
      message: `Email sent to ${patientName || 'patient'} (${patientEmail}) about their ${reportType || 'report'} from ${clinicName || 'clinic'}.`,
      clinicName,
      patientName,
      action: 'email_sent',
      actionData: { patientEmail, reportType }
    });
  }

  async notifyClinicRegistered({ clinicId, clinicName, contactPerson, email }) {
    return this.create({
      type: 'warning',
      category: 'clinic',
      title: 'New Clinic Registration',
      message: `${clinicName} registered by ${contactPerson || 'unknown'}. Email: ${email}. Awaiting approval.`,
      clinicId,
      clinicName,
      action: 'approve_clinic',
      actionData: { contactPerson, email }
    });
  }

  async notifyClinicApproved({ clinicId, clinicName }) {
    return this.create({
      type: 'success',
      category: 'clinic',
      title: 'Clinic Approved',
      message: `${clinicName} has been approved and credentials sent.`,
      clinicId,
      clinicName,
      action: null
    });
  }

  async notifyPaymentReceived({ clinicName, patientName, amount, planName }) {
    return this.create({
      type: 'success',
      category: 'payment',
      title: 'Payment Received',
      message: `Payment of $${amount} received from ${patientName || clinicName || 'user'} for ${planName || 'subscription'}.`,
      clinicName,
      patientName,
      action: 'view_payment'
    });
  }

  async notifyUsageLimitWarning({ clinicId, clinicName, used, allowed, percentage }) {
    return this.create({
      type: percentage >= 95 ? 'critical' : 'warning',
      category: 'usage',
      title: percentage >= 95 ? 'Critical: Report Limit Nearly Reached' : 'Warning: High Report Usage',
      message: `${clinicName} has used ${used}/${allowed} reports (${percentage}%).`,
      clinicId,
      clinicName,
      action: 'increase_limit',
      actionData: { used, allowed, percentage }
    });
  }

  // Convert snake_case DB row to camelCase
  _toCamelCase(row) {
    if (!row) return null;
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      title: row.title,
      message: row.message,
      clinicId: row.clinic_id,
      clinicName: row.clinic_name,
      patientId: row.patient_id,
      patientName: row.patient_name,
      reportId: row.report_id,
      action: row.action,
      actionData: row.action_data,
      isRead: row.is_read,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default new NotificationService();
