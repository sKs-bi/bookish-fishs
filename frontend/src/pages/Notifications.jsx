import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import { formatDateTime } from '../utils/helpers';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications({ pageSize: 50 });
  }, []);

  const handleMarkRead = async (id) => {
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const getTypeLabel = (type) => {
    const labels = {
      'system': '系统',
      'approval': '审批',
      'warning': '预警',
      'reminder': '提醒'
    };
    return labels[type] || type;
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      'system': 'badge-gray',
      'approval': 'badge-primary',
      'warning': 'badge-warning',
      'reminder': 'badge-success'
    };
    return classes[type] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          通知中心
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">({unreadCount}条未读)</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary">
            全部标记已读
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${notification.is_read ? '' : 'bg-blue-50'}`}
                onClick={() => !notification.is_read && handleMarkRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${getTypeBadgeClass(notification.type)}`}>{getTypeLabel(notification.type)}</span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium text-gray-800">{notification.title}</h3>
                    {notification.content && (
                      <p className="mt-1 text-sm text-gray-600">{notification.content}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">{formatDateTime(notification.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
