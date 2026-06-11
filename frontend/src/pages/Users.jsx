import { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../services/api';
import { formatDateTime, getStatusBadgeClass, getStatusText, getRoleText, getRoleBadgeClass } from '../utils/helpers';
import useAuthStore from '../stores/authStore';

const Users = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', role: '', status: '', department_id: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.list({ page, pageSize, ...filters });
      setUsers(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取用户列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getTree();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('获取部门列表失败', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    try {
      await userAPI.delete(id);
      fetchUsers();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('确定要重置该用户密码吗？')) return;
    try {
      await userAPI.resetPassword(id);
      alert('密码已重置为 admin123');
    } catch (error) {
      alert(error.message || '重置失败');
    }
  };

  const handleApprove = async (id) => {
    try {
      await userAPI.approve(id);
      fetchUsers();
    } catch (error) {
      alert(error.message || '审核失败');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
    const msg = newStatus === 'frozen' ? '确定要冻结该用户吗？' : '确定要解冻该用户吗？';
    if (!window.confirm(msg)) return;
    try {
      await userAPI.updateStatus(id, { status: newStatus });
      fetchUsers();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">用户管理</h1>
      </div>

      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 sm:gap-4 items-end">
          <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
            <label className="label">关键词搜索</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="input"
              placeholder="搜索用户名、姓名、邮箱..."
            />
          </div>
          <div className="w-28 sm:w-32">
            <label className="label">角色</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input"
            >
              <option value="">全部</option>
              <option value="super_admin">超级管理员</option>
              <option value="dept_admin">部门管理员</option>
              <option value="normal_user">普通用户</option>
            </select>
          </div>
          <div className="w-28 sm:w-32">
            <label className="label">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">全部</option>
              <option value="active">正常</option>
              <option value="inactive">待审核</option>
              <option value="frozen">已冻结</option>
            </select>
          </div>
          <div className="w-28 sm:w-36">
            <label className="label">所属部门</label>
            <select
              value={filters.department_id}
              onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
              className="input"
            >
              <option value="">全部</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">用户名</th>
                <th className="table-header">姓名</th>
                <th className="table-header">角色</th>
                <th className="table-header">部门</th>
                <th className="table-header">状态</th>
                <th className="table-header">最后登录</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">加载中...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">暂无数据</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{user.username}</td>
                    <td className="table-cell">{user.real_name}</td>
                    <td className="table-cell">
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="table-cell">{user.department?.name || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {user.last_login_time ? formatDateTime(user.last_login_time) : '从未登录'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        {user.status === 'inactive' && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            审核通过
                          </button>
                        )}
                        {currentUser?.role === 'super_admin' && user.status === 'active' && (
                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            冻结
                          </button>
                        )}
                        {currentUser?.role === 'super_admin' && user.status === 'frozen' && (
                          <button
                            onClick={() => handleToggleStatus(user.id, user.status)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            解冻
                          </button>
                        )}
                        {currentUser?.role === 'super_admin' && (
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            重置密码
                          </button>
                        )}
                        {currentUser?.role === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize)} 页
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-secondary"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="btn btn-secondary"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
