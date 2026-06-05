import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';
import useNotificationStore from '../stores/notificationStore';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { statistics, fetchStatistics, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchNotifications({ pageSize: 5 });
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { path: '/dashboard', label: '首页概览', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    ...(user?.role === 'super_admin' || user?.role === 'dept_admin' ? [
      { path: '/users', label: '用户管理', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ] : []),
    { path: '/assets', label: '资产管理', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/asset-loans', label: '资产领用', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { path: '/purchases', label: '采购申请', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/repairs', label: '维修管理', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ...(user?.role !== 'normal_user' ? [
      { path: '/departments', label: '部门管理', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    ] : []),
    { path: '/role-upgrade-approval', label: '审批中心', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    ...(user?.role === 'super_admin' ? [
      { path: '/asset-types', label: '资产类型', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
      { path: '/backups', label: '数据备份', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
      { path: '/system-config', label: '系统配置', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
      { path: '/audit-logs', label: '审计日志', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'super_admin': return '超级管理员';
      case 'dept_admin': return '部门管理员';
      case 'normal_user': return '普通用户';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 sm:hidden"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/long.jpg" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="w-full h-full items-center justify-center text-white font-bold text-sm sm:text-base" style={{ display: 'none' }}>
                  ZC
                </div>
              </div>
              <div className="ml-2 sm:ml-3 hidden sm:block">
                <div className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">
                  数<span style={{ color: '#60A5FA' }}>智</span>科<span style={{ color: '#FB923C' }}>技</span>产业学院
                </div>
                <div className="text-[10px] tracking-[0.15em] text-gray-800 font-medium">
                  DIGITAL <span style={{ color: '#60A5FA' }}>I</span>NTELLIGENCE <span style={{ color: '#FB923C' }}>T</span>ECHNOLOGY
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="flex items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm sm:text-base">
                  {user?.real_name?.charAt(0) || 'U'}
                </div>
                <div className="ml-1.5 sm:ml-2 hidden sm:block">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">{user?.real_name}</p>
                  <p className="text-xs text-gray-500">{getRoleText(user?.role)}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-1.5 sm:ml-4 text-xs sm:text-sm text-gray-500 hover:text-gray-700 whitespace-nowrap"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
          pt-14 sm:pt-16 lg:pt-0
        `}>
          <div className="lg:hidden absolute top-0 left-0 right-0 h-14 sm:h-16 bg-white border-b border-gray-200 flex flex-col justify-center px-4">
            <div className="text-lg font-semibold text-gray-800 leading-tight">
              数<span style={{ color: '#60A5FA' }}>智</span>科<span style={{ color: '#FB923C' }}>技</span>产业学院
            </div>
            <div className="text-[10px] tracking-[0.15em] text-gray-800 font-medium">
              DIGITAL <span style={{ color: '#60A5FA' }}>I</span>NTELLIGENCE <span style={{ color: '#FB923C' }}>T</span>ECHNOLOGY
            </div>
          </div>
          <nav className="mt-0 lg:mt-5 px-2 py-4 lg:py-5 space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[calc(100vh-3.5rem)] lg:max-h-[calc(100vh-8rem)]">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`${location.pathname === item.path ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'} group flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors w-full`}
              >
                <svg className={`${location.pathname === item.path ? 'text-white' : 'text-gray-400'} mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
