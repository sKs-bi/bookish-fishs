import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const UserCard = ({ userId, x, y, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const response = await userAPI.getById(userId);
        setUser(response.data);
      } catch (err) {
        setError('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const getRoleName = (role) => {
    const roleMap = {
      'super_admin': '超级管理员',
      'dept_admin': '部门管理员',
      'normal_user': '普通用户'
    };
    return roleMap[role] || role;
  };

  // 计算卡片位置，确保不超出屏幕
  const cardStyle = {
    left: Math.min(x || 0, window.innerWidth - 340),
    top: Math.min(y || 0, window.innerHeight - 300),
  };

  return (
    <>
      {/* 遮罩层 - 点击任意位置关闭 */}
      <div className="user-card-overlay" onClick={onClose} />
      
      {/* 用户卡片 */}
      <div className="user-card" style={cardStyle}>
        {loading ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : error || !user ? (
          <div className="text-center py-4 text-red-500">{error || '用户不存在'}</div>
        ) : (
          <>
            <div className="flex items-center mb-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                {user.real_name?.charAt(0) || user.username?.charAt(0)}
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900">{user.real_name || '-'}</div>
                <div className="text-sm text-gray-500">@{user.username}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">所属院系</span>
                <span className="text-gray-900">{user.department?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">角色</span>
                <span className="text-gray-900">{getRoleName(user.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手机号</span>
                <span className="text-gray-900">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">邮箱</span>
                <span className="text-gray-900 truncate ml-4">{user.email || '-'}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UserCard;
