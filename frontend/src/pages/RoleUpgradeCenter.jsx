import { useState, useEffect } from 'react';
import { roleUpgradeAPI } from '../services/api';
import useAuthStore from '../stores/authStore';
import { formatDateTime } from '../utils/helpers';

const RoleUpgradeCenter = () => {
  const { user } = useAuthStore();
  const [targets, setTargets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTargets = async () => {
    try {
      const res = await roleUpgradeAPI.getTargets();
      setTargets(res.data || []);
    } catch (e) {
      console.error('获取升级目标失败', e);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await roleUpgradeAPI.getMyRequests({ page, pageSize, status: filterStatus || undefined });
      setRequests(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('获取申请列表失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
    fetchRequests();
  }, [page, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetRole) {
      alert('请选择升级目标');
      return;
    }
    setSubmitting(true);
    try {
      await roleUpgradeAPI.createRequest({ target_role: targetRole, reason });
      setShowModal(false);
      setTargetRole('');
      setReason('');
      fetchRequests();
      alert('申请已提交，请等待超级管理员审批');
    } catch (e) {
      alert(e.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('确定要撤销该申请吗？')) return;
    try {
      await roleUpgradeAPI.cancelRequest(id);
      fetchRequests();
    } catch (e) {
      alert(e.message || '撤销失败');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { class: 'bg-yellow-100 text-yellow-800', text: '待审核' },
      approved: { class: 'bg-green-100 text-green-800', text: '已通过' },
      rejected: { class: 'bg-red-100 text-red-800', text: '已拒绝' }
    };
    const s = map[status] || { class: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.class}`}>{s.text}</span>;
  };

  const getRoleText = (role) => {
    const map = { normal_user: '普通用户', dept_admin: '系管理员', super_admin: '超级管理员' };
    return map[role] || role;
  };

  const hasPendingRequest = requests.some(r => r.status === 'pending');

  if (user?.role === 'super_admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">申请中心</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">您已是超级管理员，无需申请升级。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">申请中心</h1>
        {targets.length > 0 && !hasPendingRequest && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            发起升级申请
          </button>
        )}
      </div>

      {hasPendingRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">您有待审核的申请，请等待审批结果后再提交新申请。</p>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">状态筛选：</label>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="input w-32">
            <option value="">全部</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">申请时间</th>
                <th className="table-header">当前角色</th>
                <th className="table-header">目标角色</th>
                <th className="table-header">申请理由</th>
                <th className="table-header">状态</th>
                <th className="table-header">审批意见</th>
                <th className="table-header">审批时间</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8">加载中...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">暂无申请记录</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="table-cell">{formatDateTime(req.created_at)}</td>
                    <td className="table-cell">{getRoleText(req.current_role)}</td>
                    <td className="table-cell">{getRoleText(req.target_role)}</td>
                    <td className="table-cell max-w-[200px] truncate" title={req.reason}>{req.reason || '-'}</td>
                    <td className="table-cell">{getStatusBadge(req.status)}</td>
                    <td className="table-cell max-w-[200px] truncate" title={req.review_comment}>{req.review_comment || '-'}</td>
                    <td className="table-cell">{req.reviewed_at ? formatDateTime(req.reviewed_at) : '-'}</td>
                    <td className="table-cell">
                      {req.status === 'pending' && (
                        <button onClick={() => handleCancel(req.id)} className="text-red-600 hover:text-red-800 text-sm">
                          撤销
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-secondary">上一页</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / pageSize)} className="btn btn-secondary">下一页</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">发起升级申请</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">当前角色</label>
                <input type="text" value={getRoleText(user?.role)} disabled className="input bg-gray-50" />
              </div>
              <div>
                <label className="label">升级目标 <span className="text-red-500">*</span></label>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="input" required>
                  <option value="">请选择</option>
                  {targets.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">申请理由</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input" rows="3" placeholder="请说明申请理由（选填）" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                  {submitting ? '提交中...' : '提交申请'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleUpgradeCenter;
