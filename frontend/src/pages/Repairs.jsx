import UserCard from '../components/UserCard';
import { useState, useEffect } from 'react';
import { repairAPI, assetAPI } from '../services/api';
import { formatDateTime, getStatusBadgeClass, getStatusText, formatCurrency } from '../utils/helpers';
import useAuthStore from '../stores/authStore';

const Repairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [userCardInfo, setUserCardInfo] = useState({ show: false, userId: null, x: 0, y: 0 });
  const [formData, setFormData] = useState({ asset_id: '', fault_description: '' });
  const { user } = useAuthStore();

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const response = await repairAPI.list({ page, pageSize, ...filters });
      setRepairs(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取维修记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await assetAPI.list({ pageSize: 100 });
      setAssets(response.data.items);
    } catch (error) {
      console.error('获取资产列表失败', error);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [page, filters]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await repairAPI.create(formData);
      setShowModal(false);
      setFormData({ asset_id: '', fault_description: '' });
      fetchRepairs();
    } catch (error) {
      alert(error.message || '提交失败');
    }
  };

  const handleAudit = async (id, action, remark = '') => {
    try {
      await repairAPI.audit(id, { action, remark });
      fetchRepairs();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleComplete = async (id) => {
    const repair_cost = window.prompt('请输入维修费用:', '0');
    if (repair_cost === null) return;
    const repair_result = window.prompt('请输入维修结果:', '');
    if (repair_result === null) return;
    try {
      await repairAPI.completeRepair(id, { repair_cost: parseFloat(repair_cost), repair_result });
      fetchRepairs();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleAcceptance = async (id, action, remark = '') => {
    try {
      await repairAPI.acceptance(id, { action, remark });
      fetchRepairs();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('确定要撤回该维修申请吗？')) return;
    try {
      await repairAPI.withdraw(id);
      fetchRepairs();
    } catch (error) {
      alert(error.message || '撤回失败');
    }
  };

  const isDeptAdmin = user?.role === 'dept_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">维修管理</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">提交报修</button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 sm:gap-4">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input w-full sm:w-40">
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="in_repair">维修中</option>
            <option value="completed">已完成</option>
            <option value="rejected">已驳回</option>
            <option value="withdrawn">已撤回</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">维修单号</th>
                <th className="table-header">资产</th>
                <th className="table-header">报修人</th>
                <th className="table-header">报修时间</th>
                <th className="table-header">维修费用</th>
                <th className="table-header">状态</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">加载中...</td></tr>
              ) : repairs.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">暂无数据</td></tr>
              ) : (
                repairs.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-sm">{item.repair_code}</td>
                    <td className="table-cell">
                      <p className="font-medium">{item.asset?.name}</p>
                      <p className="text-xs text-gray-500">{item.asset?.asset_code}</p>
                    </td>
                    <td className="table-cell relative">
                        {item.reporter_id ? (
                          <span
                            className="user-name-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.target.getBoundingClientRect();
                              setUserCardInfo({ show: true, userId: item.reporter_id, x: rect.left, y: rect.bottom + 5 });
                            }}
                          >
                            {item.reporter?.real_name || '-'}
                          </span>
                        ) : (
                          <span>{item.reporter?.real_name || '-'}</span>
                        )}
                        {userCardInfo.show && userCardInfo.userId === item.reporter_id && (
                          <div style={{ position: 'fixed', left: userCardInfo.x, top: userCardInfo.y }}>
                            <UserCard userId={userCardInfo.userId} x={userCardInfo.x} y={userCardInfo.y} onClose={() => setUserCardInfo({ show: false, userId: null, x: 0, y: 0 })} />
                          </div>
                        )}
                      </td>
                    <td className="table-cell text-gray-500">{formatDateTime(item.created_at)}</td>
                    <td className="table-cell">{formatCurrency(item.repair_cost)}</td>
                    <td className="table-cell"><span className={`badge ${getStatusBadgeClass(item.status)}`}>{getStatusText(item.status)}</span></td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        {item.status === 'pending' && (isDeptAdmin || isSuperAdmin) && item.reporter?.id !== user?.id && (
                          <>
                            <button onClick={() => handleAudit(item.id, 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                            <button onClick={() => handleAudit(item.id, 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                          </>
                        )}
                        {item.status === 'pending' && item.reporter?.id === user?.id && (
                          <button onClick={() => handleWithdraw(item.id)} className="text-gray-600 hover:text-gray-800 text-sm">撤回</button>
                        )}
                        {item.status === 'in_repair' && (isDeptAdmin || isSuperAdmin) && (
                          <button onClick={() => handleComplete(item.id)} className="text-blue-600 hover:text-blue-800 text-sm">完成维修</button>
                        )}
                        {item.acceptance_status === 'pending' && item.repair_status === 'completed' && (isDeptAdmin || isSuperAdmin) && (
                          <>
                            <button onClick={() => handleAcceptance(item.id, 'accept')} className="text-green-600 hover:text-green-800 text-sm">验收通过</button>
                            <button onClick={() => handleAcceptance(item.id, 'reject')} className="text-red-600 hover:text-red-800 text-sm">验收不通过</button>
                          </>
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
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-secondary">上一页</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / pageSize)} className="btn btn-secondary">下一页</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">提交报修申请</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">选择资产 *</label>
                <select value={formData.asset_id} onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })} className="input" required>
                  <option value="">请选择资产</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_code} - {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">故障描述 *</label>
                <textarea value={formData.fault_description} onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })} className="input" rows="4" placeholder="请详细描述故障情况..." required />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">提交</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repairs;
