import { useState, useEffect } from 'react';
import { assetAPI } from '../services/api';
import { formatDate, getStatusBadgeClass, getStatusText } from '../utils/helpers';
import useAuthStore from '../stores/authStore';

const AssetLoan = () => {
  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [formData, setFormData] = useState({ asset_id: '', expected_return_date: '', purpose: '' });
  const { user } = useAuthStore();

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.getLoans({ page, pageSize, ...filters });
      setLoans(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取领用记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const response = await assetAPI.list({ status: 'idle', pageSize: 100 });
      setAssets(response.data.items);
    } catch (error) {
      console.error('获取资产列表失败', error);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, filters]);

  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assetAPI.createLoan(formData);
      setShowModal(false);
      setFormData({ asset_id: '', expected_return_date: '', purpose: '' });
      fetchLoans();
    } catch (error) {
      alert(error.message || '提交失败');
    }
  };

  const handleApprove = async (id, action) => {
    try {
      await assetAPI.approveLoan(id, { action });
      fetchLoans();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('确定要撤回该领用申请吗？')) return;
    try {
      await assetAPI.withdrawLoan(id);
      fetchLoans();
    } catch (error) {
      alert(error.message || '撤回失败');
    }
  };

  const isDeptAdmin = user?.role === 'dept_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">资产领用</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          发起领用
        </button>
      </div>

      <div className="card p-4">
        <div className="flex gap-4">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input w-40">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="approved">已通过</option>
            <option value="returned">已归还</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">资产编号</th>
                <th className="table-header">资产名称</th>
                <th className="table-header">领用人</th>
                <th className="table-header">领用用途</th>
                <th className="table-header">预计归还</th>
                <th className="table-header">状态</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8">加载中...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">暂无数据</td></tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-sm">{loan.asset?.asset_code}</td>
                    <td className="table-cell font-medium">{loan.asset?.name}</td>
                    <td className="table-cell">{loan.user?.real_name}</td>
                    <td className="table-cell max-w-xs truncate">{loan.purpose || '-'}</td>
                    <td className="table-cell">{formatDate(loan.expected_return_date)}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadgeClass(loan.status)}`}>{getStatusText(loan.status)}</span>
                    </td>
                    <td className="table-cell">
                      {loan.status === 'pending' && (isDeptAdmin || isSuperAdmin) && loan.user?.id !== user?.id && (
                        <div className="flex space-x-2">
                          <button onClick={() => handleApprove(loan.id, 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                          <button onClick={() => handleApprove(loan.id, 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                        </div>
                      )}
                      {loan.status === 'pending' && loan.user?.id === user?.id && (
                        <button onClick={() => handleWithdraw(loan.id)} className="text-gray-600 hover:text-gray-800 text-sm">撤回</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">发起领用申请</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">选择资产 *</label>
                <select value={formData.asset_id} onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })} className="input" required>
                  <option value="">请选择空闲资产</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_code} - {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">预计归还日期</label>
                <input type="date" value={formData.expected_return_date} onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">领用用途</label>
                <textarea value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="input" rows="3" />
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

export default AssetLoan;
