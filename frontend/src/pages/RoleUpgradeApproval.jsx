import { useState, useEffect } from 'react';
import { assetAPI, purchaseAPI, repairAPI } from '../services/api';
import { formatDateTime, getStatusBadgeClass, formatCurrency } from '../utils/helpers';
import useAuthStore from '../stores/authStore';

const getDisplayStatusText = (status, isSuperAdmin) => {
  if (isSuperAdmin && status === 'dept_pending') {
    return '待审核';
  }
  const statusMap = {
    'active': '正常',
    'inactive': '待审核',
    'frozen': '已冻结',
    'pending': '待审核',
    'pending_delete': '待删除',
    'idle': '正常',
    'in_use': '正常',
    'repairing': '维修中',
    'in_repair': '维修中',
    'transferred': '正常',
    'scrapped': '报废',
    'approved': '已通过',
    'rejected': '已驳回',
    'returned': '已归还',
    'overdue': '已逾期',
    'cancelled': '已取消',
    'withdrawn': '已撤回',
    'draft': '草稿',
    'dept_pending': '部门待审',
    
    'from_approved': '调出已审',
    'to_approved': '调入已审',
    'super_approved': '终审已审',
    'completed': '已完成',
    'in_progress': '进行中',
    'verified': '已核销',
  };
  return statusMap[status] || status;
};

const RoleUpgradeApproval = () => {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [loans, setLoans] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const { user } = useAuthStore();

  const isDeptAdmin = user?.role === 'dept_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await purchaseAPI.list({ page, pageSize, status: filterStatus || undefined });
      setPurchases(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('获取采购申请失败', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await assetAPI.getLoans({ page, pageSize, status: filterStatus || undefined });
      setLoans(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('获取领用申请失败', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const res = await repairAPI.list({ page, pageSize, status: filterStatus || undefined });
      setRepairs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('获取维修申请失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setFilterStatus('');
    setSelectedIds([]);
  }, [activeTab]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filterStatus]);

  useEffect(() => {
    if (activeTab === 'purchases') fetchPurchases();
    else if (activeTab === 'loans') fetchLoans();
    else if (activeTab === 'repairs') fetchRepairs();
  }, [activeTab, page, filterStatus]);

  const handlePurchaseAudit = async (id, auditType, action) => {
    try {
      if (auditType === 'dept') {
        await purchaseAPI.deptAudit(id, { action });
      } else {
        await purchaseAPI.superAudit(id, { action });
      }
      fetchPurchases();
    } catch (e) {
      alert(e.message || '操作失败');
    }
  };

  const handleLoanApprove = async (id, action) => {
    try {
      await assetAPI.approveLoan(id, { action });
      fetchLoans();
    } catch (e) {
      alert(e.message || '操作失败');
    }
  };

  const handleRepairAudit = async (id, action) => {
    try {
      await repairAPI.audit(id, { action });
      fetchRepairs();
    } catch (e) {
      alert(e.message || '操作失败');
    }
  };

  const handleWithdraw = async (type, id) => {
    if (!window.confirm('确定要撤回该申请吗？')) return;
    try {
      if (type === 'purchase') {
        await purchaseAPI.withdraw(id);
        fetchPurchases();
      } else if (type === 'loan') {
        await assetAPI.withdrawLoan(id);
        fetchLoans();
      } else {
        await repairAPI.withdraw(id);
        fetchRepairs();
      }
    } catch (e) {
      alert(e.message || '撤回失败');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      let ids = [];
      if (activeTab === 'purchases') {
        ids = purchases.filter(p => 
          ((p.status === 'dept_pending' ) && isSuperAdmin && p.applicant_id !== user?.id) ||
          (p.status === 'dept_pending' && isDeptAdmin && p.applicant_id !== user?.id)
        ).map(p => p.id);
      } else if (activeTab === 'loans') {
        ids = loans.filter(l => l.status === 'pending' && (isDeptAdmin || isSuperAdmin) && l.user?.id !== user?.id).map(l => l.id);
      } else {
        ids = repairs.filter(r => r.status === 'pending' && (isDeptAdmin || isSuperAdmin) && r.reporter?.id !== user?.id).map(r => r.id);
      }
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchAction = async (action) => {
    if (selectedIds.length === 0) {
      alert('请先选择要审批的申请');
      return;
    }

    if (!window.confirm(`确定要批量${action === 'approve' ? '通过' : '驳回'} ${selectedIds.length} 条申请吗？`)) {
      return;
    }

    setBatchLoading(true);
    try {
      if (activeTab === 'purchases') {
        let auditType = 'dept';
        if (isSuperAdmin) {
          auditType = 'super';
          auditType = 'super';
        }
        await purchaseAPI.batchAudit({ ids: selectedIds, action, auditType });
        fetchPurchases();
      } else if (activeTab === 'loans') {
        await assetAPI.batchApproveLoans({ ids: selectedIds, action });
        fetchLoans();
      } else {
        await repairAPI.batchAudit({ ids: selectedIds, action });
        fetchRepairs();
      }
      setSelectedIds([]);
    } catch (e) {
      alert(e.message || '操作失败');
    } finally {
      setBatchLoading(false);
    }
  };

  const getSelectableCount = () => {
    if (activeTab === 'purchases') {
      return purchases.filter(p => 
        ((p.status === 'dept_pending' ) && isSuperAdmin && p.applicant_id !== user?.id) ||
        (p.status === 'dept_pending' && isDeptAdmin && p.applicant_id !== user?.id)
      ).length;
    } else if (activeTab === 'loans') {
      return loans.filter(l => l.status === 'pending' && (isDeptAdmin || isSuperAdmin) && l.user?.id !== user?.id).length;
    } else {
      return repairs.filter(r => r.status === 'pending' && (isDeptAdmin || isSuperAdmin) && r.reporter?.id !== user?.id).length;
    }
  };

  const getStatusFilterOptions = () => {
    if (activeTab === 'purchases') {
      if (isSuperAdmin) {
        return (
          <>
            <option value="">全部状态</option>
            <option value="dept_pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="withdrawn">已撤回</option>
          </>
        );
      }
      return (
        <>
          <option value="">全部状态</option>
          <option value="dept_pending">部门待审</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
          <option value="withdrawn">已撤回</option>
        </>
      );
    } else if (activeTab === 'loans') {
      return (
        <>
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="cancelled">已取消</option>
        </>
      );
    } else {
      return (
        <>
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="in_repair">维修中</option>
          <option value="completed">已完成</option>
          <option value="rejected">已驳回</option>
          <option value="withdrawn">已撤回</option>
        </>
      );
    }
  };

  const renderPurchases = () => {
    const selectableCount = getSelectableCount();
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header w-12">
              <input
                type="checkbox"
                checked={selectableCount > 0 && selectedIds.length === selectableCount}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </th>
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
            <tr><td colSpan="9" className="text-center py-8">加载中...</td></tr>
          ) : purchases.length === 0 ? (
            <tr><td colSpan="9" className="text-center py-8 text-gray-500">暂无数据</td></tr>
          ) : (
            purchases.map((item) => {
              const canSelect = ((item.status === 'dept_pending' ) && isSuperAdmin && item.applicant_id !== user?.id) ||
                               (item.status === 'dept_pending' && isDeptAdmin && item.applicant_id !== user?.id);
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectOne(item.id)}
                      disabled={!canSelect}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                  <td className="table-cell font-mono text-sm">{item.application_code}</td>
                  <td className="table-cell font-medium">{item.name}</td>
                  <td className="table-cell">{item.quantity}</td>
                  <td className="table-cell">{formatCurrency(item.total_price || 0)}</td>
                  <td className="table-cell">{item.applicant?.real_name}</td>
                  <td className="table-cell text-gray-500">{formatDateTime(item.created_at)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusBadgeClass(item.status)}`}>{getDisplayStatusText(item.status, isSuperAdmin)}</span></td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {item.status === 'dept_pending' && isDeptAdmin && item.applicant_id !== user?.id && (
                        <>
                          <button onClick={() => handlePurchaseAudit(item.id, 'dept', 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                          <button onClick={() => handlePurchaseAudit(item.id, 'dept', 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                        </>
                      )}
                      {(item.status === 'dept_pending' ) && isSuperAdmin && item.applicant_id !== user?.id && (
                        <>
                          <button onClick={() => handlePurchaseAudit(item.id, 'super', 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                          <button onClick={() => handlePurchaseAudit(item.id, 'super', 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  const renderLoans = () => {
    const selectableCount = getSelectableCount();
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header w-12">
              <input
                type="checkbox"
                checked={selectableCount > 0 && selectedIds.length === selectableCount}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </th>
            <th className="table-header">资产编号</th>
            <th className="table-header">资产名称</th>
            <th className="table-header">领用人</th>
            <th className="table-header">领用用途</th>
            <th className="table-header">预计归还</th>
            <th className="table-header">申请时间</th>
            <th className="table-header">状态</th>
            <th className="table-header">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr><td colSpan="9" className="text-center py-8">加载中...</td></tr>
          ) : loans.length === 0 ? (
            <tr><td colSpan="9" className="text-center py-8 text-gray-500">暂无数据</td></tr>
          ) : (
            loans.map((loan) => {
              const canSelect = loan.status === 'pending' && (isDeptAdmin || isSuperAdmin) && loan.user?.id !== user?.id;
              return (
                <tr key={loan.id} className={`hover:bg-gray-50 ${selectedIds.includes(loan.id) ? 'bg-blue-50' : ''}`}>
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(loan.id)}
                      onChange={() => handleSelectOne(loan.id)}
                      disabled={!canSelect}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                  <td className="table-cell font-mono text-sm">{loan.asset?.asset_code}</td>
                  <td className="table-cell font-medium">{loan.asset?.name}</td>
                  <td className="table-cell">{loan.user?.real_name}</td>
                  <td className="table-cell max-w-xs truncate">{loan.purpose || '-'}</td>
                  <td className="table-cell">{loan.expected_return_date ? formatDateTime(loan.expected_return_date).split(' ')[0] : '-'}</td>
                  <td className="table-cell text-gray-500">{formatDateTime(loan.created_at)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusBadgeClass(loan.status)}`}>{getDisplayStatusText(loan.status, isSuperAdmin)}</span></td>
                  <td className="table-cell">
                    {loan.status === 'pending' && (isDeptAdmin || isSuperAdmin) && loan.user?.id !== user?.id && (
                      <div className="flex space-x-2">
                        <button onClick={() => handleLoanApprove(loan.id, 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                        <button onClick={() => handleLoanApprove(loan.id, 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  const renderRepairs = () => {
    const selectableCount = getSelectableCount();
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header w-12">
              <input
                type="checkbox"
                checked={selectableCount > 0 && selectedIds.length === selectableCount}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </th>
            <th className="table-header">维修单号</th>
            <th className="table-header">资产</th>
            <th className="table-header">报修人</th>
            <th className="table-header">故障描述</th>
            <th className="table-header">申请时间</th>
            <th className="table-header">状态</th>
            <th className="table-header">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
            <tr><td colSpan="8" className="text-center py-8">加载中...</td></tr>
          ) : repairs.length === 0 ? (
            <tr><td colSpan="8" className="text-center py-8 text-gray-500">暂无数据</td></tr>
          ) : (
            repairs.map((item) => {
              const canSelect = item.status === 'pending' && (isDeptAdmin || isSuperAdmin) && item.reporter?.id !== user?.id;
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${selectedIds.includes(item.id) ? 'bg-blue-50' : ''}`}>
                  <td className="table-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectOne(item.id)}
                      disabled={!canSelect}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                  </td>
                  <td className="table-cell font-mono text-sm">{item.repair_code}</td>
                  <td className="table-cell">
                    <p className="font-medium">{item.asset?.name}</p>
                    <p className="text-xs text-gray-500">{item.asset?.asset_code}</p>
                  </td>
                  <td className="table-cell">{item.reporter?.real_name}</td>
                  <td className="table-cell max-w-xs truncate">{item.fault_description || '-'}</td>
                  <td className="table-cell text-gray-500">{formatDateTime(item.created_at)}</td>
                  <td className="table-cell"><span className={`badge ${getStatusBadgeClass(item.status)}`}>{getDisplayStatusText(item.status, isSuperAdmin)}</span></td>
                  <td className="table-cell">
                    {item.status === 'pending' && (isDeptAdmin || isSuperAdmin) && item.reporter?.id !== user?.id && (
                      <div className="flex space-x-2">
                        <button onClick={() => handleRepairAudit(item.id, 'approve')} className="text-green-600 hover:text-green-800 text-sm">通过</button>
                        <button onClick={() => handleRepairAudit(item.id, 'reject')} className="text-red-600 hover:text-red-800 text-sm">驳回</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    );
  };

  const showBatchButtons = () => {
    if (activeTab === 'purchases') {
      if (isSuperAdmin) {
        return true;
      }
      return filterStatus === 'dept_pending' && isDeptAdmin;
    } else if (activeTab === 'loans') {
      if (isSuperAdmin) {
        return true;
      }
      return filterStatus === 'pending' && isDeptAdmin;
    } else {
      if (isSuperAdmin) {
        return true;
      }
      return filterStatus === 'pending' && isDeptAdmin;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">审批中心</h1>
        {showBatchButtons() && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">已选择 <span className="text-blue-600 font-bold">{selectedIds.length}</span> 条</span>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-200 flex items-center justify-between pr-4">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'purchases' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              采购申请
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'loans' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              资产领用
            </button>
            <button
              onClick={() => setActiveTab('repairs')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'repairs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              维修管理
            </button>
          </nav>
          {showBatchButtons() && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBatchAction('approve')}
                disabled={batchLoading || selectedIds.length === 0}
                className="group relative px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium overflow-hidden shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/35 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>一键通过</span>
                </div>
              </button>
              <button
                onClick={() => handleBatchAction('reject')}
                disabled={batchLoading || selectedIds.length === 0}
                className="group relative px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-medium overflow-hidden shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span>一键驳回</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600">状态筛选：</label>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="input w-full sm:w-40">
              {getStatusFilterOptions()}
            </select>
            {showBatchButtons() && (
              <span className="text-xs text-gray-500 ml-2">提示：筛选待审核状态后可使用批量审批功能</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'purchases' && renderPurchases()}
          {activeTab === 'loans' && renderLoans()}
          {activeTab === 'repairs' && renderRepairs()}
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-200">
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-secondary">上一页</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / pageSize)} className="btn btn-secondary">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleUpgradeApproval;
