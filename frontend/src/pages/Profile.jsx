import { useState } from 'react';
import useAuthStore from '../stores/authStore';

const Profile = () => {
  const { user, changePassword } = useAuthStore();
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('两次输入的新密码不一致');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('新密码长度不能少于6位');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      setMessage('密码修改成功');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage(error.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role) => {
    const map = { 'super_admin': '超级管理员', 'dept_admin': '部门管理员', 'normal_user': '普通用户' };
    return map[role] || role;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">个人中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">基本信息</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-24 text-gray-500">用户名</div>
              <div className="flex-1 font-medium">{user?.username}</div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-gray-500">姓名</div>
              <div className="flex-1 font-medium">{user?.real_name}</div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-gray-500">角色</div>
              <div className="flex-1">
                <span className={`badge ${user?.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : user?.role === 'dept_admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {getRoleText(user?.role)}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-gray-500">部门</div>
              <div className="flex-1">{user?.department?.name || '-'}</div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-gray-500">邮箱</div>
              <div className="flex-1">{user?.email || '-'}</div>
            </div>
            <div className="flex items-center">
              <div className="w-24 text-gray-500">电话</div>
              <div className="flex-1">{user?.phone || '-'}</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">修改密码</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {message}
              </div>
            )}
            <div>
              <label className="label">旧密码</label>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">新密码</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">确认新密码</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? '修改中...' : '修改密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
