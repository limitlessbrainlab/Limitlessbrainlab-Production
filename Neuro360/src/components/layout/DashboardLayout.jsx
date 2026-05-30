import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import ProfileModal from './ProfileModal';
import NotificationService from '../../services/notificationService';
import ClinicNotificationDropdown from '../clinic/ClinicNotificationDropdown';

const DashboardLayout = ({ children, title = 'Dashboard', customNotification = null, hideSidebar = false, headerAction = null }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showClinicNotifications, setShowClinicNotifications] = useState(false);
  const { user } = useAuth();
  const bellRef = useRef(null);

  // Fetch unread notification count and subscribe to real-time updates
  useEffect(() => {
    if (user?.role === 'super_admin') {
      NotificationService.getUnreadCount().then(setUnreadCount);
      const remove = NotificationService.addListener(() => {
        setUnreadCount((prev) => prev + 1);
      });
      return () => remove();
    }

    if (user?.role === 'clinic_admin' && user?.clinicId) {
      NotificationService.getClinicUnreadCount(user.clinicId).then(setUnreadCount);
      const stop = NotificationService.startClinicRealtime(user.clinicId, () => {
        setUnreadCount((prev) => prev + 1);
      });
      return stop;
    }
  }, [user?.role, user?.clinicId]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Responsive Sidebar */}
      {!hideSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Clean Professional Header */}
        <header className="flex-shrink-0 sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              {/* Mobile menu button spacing */}
              {!hideSidebar && <div className="lg:hidden w-10 sm:w-12 flex-shrink-0"></div>}

              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">Welcome back, {user?.name || 'User'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {headerAction && <div className="hidden sm:block">{headerAction}</div>}

              {/* Notifications — bell hidden */}
              {/* {customNotification || (
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => user?.role === 'clinic_admin' && setShowClinicNotifications((prev) => !prev)}
                    className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-gray-800 px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showClinicNotifications && user?.role === 'clinic_admin' && user?.clinicId && (
                    <ClinicNotificationDropdown
                      clinicId={user.clinicId}
                      onClose={() => setShowClinicNotifications(false)}
                      onCountChange={setUnreadCount}
                    />
                  )}
                </div>
              )} */}

              {/* User Profile Button */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      (() => {
                        try {
                          if (user?.role === 'super_admin' && user?.clinicName) {
                            return user.clinicName.charAt(0).toUpperCase();
                          }
                          if (user?.role === 'clinic_admin' && user?.clinicName) {
                            return user.clinicName.charAt(0).toUpperCase();
                          }
                          if (user?.role === 'super_admin' && user?.name) {
                            return user.name.charAt(0).toUpperCase();
                          }
                          if (user?.name && typeof user.name === 'string' && user.name.length > 0) {
                            return user.name.charAt(0).toUpperCase();
                          }
                          return 'U';
                        } catch (error) {
                          console.error('Error getting user initial in DashboardLayout:', error, user);
                          return 'U';
                        }
                      })()
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;