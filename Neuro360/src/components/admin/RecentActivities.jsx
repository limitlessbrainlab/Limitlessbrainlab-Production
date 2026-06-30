import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import DatabaseService from '../../services/databaseService';
import { buildRecentActivities, getIconColor } from './recentActivitiesHelpers';

// Full "Recent Activities" view (un-sliced) for the /admin/activities tab.
// Reuses the same merge logic as the dashboard widget.
const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const clinics = await DatabaseService.get('clinics');
      const reports = await DatabaseService.get('reports');
      const payments = await DatabaseService.get('payments');
      setActivities(buildRecentActivities(clinics, reports, payments));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className={`p-2 rounded-lg ${getIconColor(activity.color)}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{activity.message}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivities;
