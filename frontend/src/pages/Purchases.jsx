import UserCard from '../components/UserCard';
import { useState, useEffect } from 'react';
import { purchaseAPI, assetAPI } from '../services/api';
import { formatDateTime, getStatusBadgeClass, getStatusText } from '../utils/helpers';
import useAuthStore from '../stores/authStore';

const getDisplayStatusText = (status, isSuperAdmin) => {
  if (isSuperAdmin && status === 'dept_pending') {
    return '待审核';
  }
  return getStatusText(status);
};

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [filters, setFilters] = useState({ status: '' });
  const [userCardInfo, setUserCardInfo] = useState({ show: false, userId: null, x: 0, y: 0 });
  const [formData, setFormData] = useState({ name: '', type_id: '', spec: '', quantity: 1, estimated_price: '', purpose: '', required_date: '' });
  const { user } = useAuthStore();

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await purchaseAPI.list({ page, pageSize, ...filters });
      setPurchases(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取采购申请列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetTypes = async () => {
    try {
      const response = await assetAPI.getTypes();
      setAssetTypes(response.data || []);
    } catch (error) {
      console.error('获取资产类型失败', error);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, filters]);

  useEffect(() => {
    fetchAssetTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await purchaseAPI.create(formData);
      setShowModal(false);
      setFormData({ name: '', type_id: '', spec: '', quantity: 1, estimated_price: '', purpose: '', required_date: '' });
      fetchPurchases();
    } catch (error) {
      alert(error.message || '提交失败');
    }
  };

  const handleAudit = async (id, auditType, action, remark = '') => {
    try {
      if (auditType === 'dept') {
        await purchaseAPI.deptAudit(id, { action, remark });
      } else {
        await purchaseAPI.superAudit(id, { action, remark });
      }
      fetchPurchases();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('确定要撤回该申请吗？')) return;
    try {
      await purchaseAPI.withdraw(id);
      fetchPurchases();
    } catch (error) {
      alert(error.message || '撤回失败');
    }
  };

  const isDeptAdmin = user?.role === 'dept_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">采购申请</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">新建申请</button>
      </div>

      <div className="card p-4">
        <div className="flex gap-3 sm:gap-4">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input w-full sm:w-40">
            <option value="">全部状态</option>
            <option value="dept_pending">待审核</option>
            <option value="approved">已通过</option>
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
                <th className="table-header">申请单号</th>
                <th className="table-header">资产名称</th>
                <th className="table-header">数量</th>
                <th className="table-header">预估金额</th>
                <th className="table-header">申请人</th>
                <th className="table-header">申请时间</th>
                <th className="table-header">状态</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-8">加载中...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">暂无数据</td></tr>
              ) : (
                purchases.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-sm">{item.application_code}</td>
                    <td className="table-cell font-medium">{item.name}</td>
                    <td className="table-cell">{item.quantity}</td>
                    <td className="table-cell">¥{item.total_price || 0}</td>
                    <td className="table-cell relative">
                        {item.applicant_id ? (
                          <span
                            className="user-name-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.target.getBoundingClientRect();
                              setUserCardInfo({ show: true, userId: item.applicant_id, x: rect.left, y: rect.bottom + 5 });
                            }}
                          >
                            {item.applicant?.real_name || '-'}
                          </span>
                        ) : (
                          <span>{item.applicant?.real_name || '-'}</span>
                        )}
                        {userCardInfo.show && userCardInfo.userId === item.applicant_id && (
                          <div style={{ position: 'fixed', left: userCardInfo.x, top: userCardInfo.y }}>
                            <UserCard userId={userCardInfo.userId} x={userCardInfo.x} y={userCardInfo.y} onClose={() => setUserCardInfo({ show: false, userId: null, x: 0, y: 0 })} />
                          </div>
                        )}
                      </td>
                    <td className="table-cell text-gray-500">{formatDateTime(item.created_at)}</td>
                    <td className="table-cell"><span className={`badge ${getStatusBadgeClass(item.status)}`}>{getDisplayStatusText(item.status, isSuperAdmin)}</span></td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        {item.status === 'dept_pending' && isDeptAdmin && item.applicant_id !== user?.id && (
                          <>
                            <button onClick={() => handleAudit(item.id, 'dept', 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                            <button onClick={() => handleAudit(item.id, 'dept', 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                          </>
                        )}
                        {item.status === 'dept_pending' && isSuperAdmin && item.applicant_id !== user?.id && (
                          <>
                            <button onClick={() => handleAudit(item.id, 'super', 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                            <button onClick={() => handleAudit(item.id, 'super', 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                          </>
                        )}
                        {['draft', 'dept_pending'].includes(item.status) && item.applicant_id === user?.id && (
                          <button onClick={() => handleWithdraw(item.id)} className="text-gray-600 hover:text-gray-800 text-sm">撤回</button>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">新建采购申请</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">资产名称 *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="label">资产类型</label>
                  <select value={formData.type_id} onChange={(e) => setFormData({ ...formData, type_id: e.target.value })} className="input">
                    <option value="">请选择</option>
                    {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">数量 *</label>
                  <input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="label">预估单价</label>
                  <input type="number" step="0.01" value={formData.estimated_price} onChange={(e) => setFormData({ ...formData, estimated_price: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">需求日期</label>
                  <input type="date" value={formData.required_date} onChange={(e) => setFormData({ ...formData, required_date: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="label">用途说明</label>
                <textarea value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="input" rows="3" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">提交申请</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
