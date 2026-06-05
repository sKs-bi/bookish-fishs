import { useState, useEffect, useRef } from 'react';
import { assetAPI, departmentAPI, rejectionAPI } from '../services/api';
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusText } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import RejectionModal from '../components/RejectionModal';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [rejections, setRejections] = useState([]);
  const [currentRejection, setCurrentRejection] = useState(null);
  const fileInputRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', type_id: '', status: '', department_id: '' });
  const [formData, setFormData] = useState({
    name: '', serial_number: '', type_id: '', brand: '', model: '', spec: '',
    purchase_date: '', purchase_price: '', supplier: '', invoice_number: '',
    warranty_end_date: '', location: '', department_id: '', responsible_id: '', remarks: ''
  });
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await assetAPI.list({ page, pageSize, ...filters });
      setAssets(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取资产列表失败', error);
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

  const fetchAssetTypes = async () => {
    try {
      const response = await assetAPI.getTypes();
      setAssetTypes(response.data || []);
    } catch (error) {
      console.error('获取资产类型失败', error);
    }
  };

  const checkRejections = async () => {
    try {
      const response = await rejectionAPI.getUnread();
      if (response.data && response.data.length > 0) {
        setRejections(response.data);
        setCurrentRejection(response.data[0]);
      }
    } catch (error) {
      console.error('检查驳回记录失败', error);
    }
  };

  const handleMarkRead = async (id) => {
    await rejectionAPI.markRead(id);
    fetchAssets();
  };

  const handleReapply = (rejection) => {
    if (rejection.original_data) {
      try {
        const data = JSON.parse(rejection.original_data);
        setFormData({
          name: data.name || '',
          serial_number: data.serial_number || '',
          type_id: data.type_id || '',
          brand: data.brand || '',
          model: data.model || '',
          spec: data.spec || '',
          purchase_date: data.purchase_date || '',
          purchase_price: data.purchase_price || '',
          supplier: data.supplier || '',
          invoice_number: data.invoice_number || '',
          warranty_end_date: data.warranty_end_date || '',
          location: data.location || '',
          department_id: data.department_id || '',
          responsible_id: data.responsible_id || '',
          remarks: data.remarks || ''
        });
        setShowModal(true);
      } catch (e) {
        console.error('解析原始数据失败', e);
      }
    }
  };

  const handleRejectionClose = () => {
    const remaining = rejections.slice(1);
    setRejections(remaining);
    if (remaining.length > 0) {
      setCurrentRejection(remaining[0]);
    } else {
      setCurrentRejection(null);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [page, filters]);

  useEffect(() => {
    fetchDepartments();
    fetchAssetTypes();
    checkRejections();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssets();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await assetAPI.create(formData);
      setShowModal(false);
      setFormData({
        name: '', serial_number: '', type_id: '', brand: '', model: '', spec: '',
        purchase_date: '', purchase_price: '', supplier: '', invoice_number: '',
        warranty_end_date: '', location: '', department_id: '', responsible_id: '', remarks: ''
      });
      if (!isAdmin) {
        alert('资产已提交，等待管理员审核');
      }
      fetchAssets();
    } catch (error) {
      alert(error.message || '创建失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await assetAPI.delete(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      if (!isAdmin) {
        alert(response.message || '删除申请已提交，等待管理员审核');
      }
      fetchAssets();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  const handleConfirmDelete = async (id) => {
    if (!window.confirm('确定要确认删除该资产吗？此操作不可逆！')) return;
    try {
      await assetAPI.confirmDelete(id);
      fetchAssets();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleRejectDelete = async (id) => {
    const reason = window.prompt('请输入驳回原因：');
    if (reason === null) return;
    try {
      await assetAPI.rejectDelete(id, { reason: reason || '未提供驳回原因' });
      fetchAssets();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    try {
      const response = await assetAPI.deleteAll();
      setShowDeleteAllModal(false);
      setDeleteAllLoading(false);
      alert(response.message || '删除成功');
      fetchAssets();
    } catch (error) {
      setDeleteAllLoading(false);
      alert(error.message || '删除失败');
    }
  };

  const handleApproveAsset = async (id) => {
    try {
      await assetAPI.approve(id);
      fetchAssets();
    } catch (error) {
      alert(error.message || '审核失败');
    }
  };

  const handleRejectAsset = async (id) => {
    const reason = window.prompt('请输入驳回原因：');
    if (reason === null) return;
    try {
      await assetAPI.reject(id, { reason: reason || '未提供驳回原因' });
      fetchAssets();
    } catch (error) {
      alert(error.message || '驳回失败');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['.xlsx', '.xls', '.csv'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedTypes.includes(extension)) {
        alert('请上传 Excel 或 CSV 文件');
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('请选择要导入的文件');
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await assetAPI.import(formData);
      setImportResult({ success: true, message: response.message, count: response.data?.count || 0 });
      fetchAssets();
      setTimeout(() => {
        setShowImportModal(false);
        setImportFile(null);
        setImportResult(null);
      }, 2000);
    } catch (error) {
      setImportResult({ success: false, message: error.message || '导入失败' });
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['资产名称', '序列号', '设备类型代码', '品牌', '型号', '规格', '购置日期', '购置价格', '供应商', '发票号', '保修截止日期', '存放位置', '部门代码', '使用状态', '备注'];
    const sampleData = [
      ['联想台式机', 'SN123456789', 'JSJSB', '联想', 'ThinkCentre', 'i5/8G/512G', '2024-01-15', '5000', '联想官网', 'FP20240115', '2027-01-15', '数智科技产业学院301', 'JSJ', '正常', '办公设备'],
      ['惠普打印机', 'HP87654321', 'DYJ', '惠普', 'LaserJet Pro', '黑白激光', '2023-06-20', '2500', '惠普授权店', 'HP20230620', '2026-06-20', '数智科技产业学院办公室', 'XZBGS', '维修中', ''],
    ];
    
    const csvContent = [headers.join(','), ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '资产导入模板.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const isWarrantyExpired = (warrantyEndDate) => {
    if (!warrantyEndDate) return false;
    return new Date(warrantyEndDate) < new Date();
  };

  const isDeptAdmin = user?.role === 'dept_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = isDeptAdmin || isSuperAdmin;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">资产管理</h1>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-rose-800 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              全部删除
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
              导入数据
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            新增资产
          </button>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 sm:gap-4 items-end">
          <div className="flex-1 min-w-[150px] sm:min-w-[200px]">
            <label className="label">关键词搜索</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="input"
              placeholder="设备名称、序列号..."
            />
          </div>
          <div className="w-28 sm:w-36">
            <label className="label">设备类型</label>
            <select value={filters.type_id} onChange={(e) => setFilters({ ...filters, type_id: e.target.value })} className="input">
              <option value="">全部</option>
              {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="w-24 sm:w-32">
            <label className="label">状态</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input">
              <option value="">全部</option>
              <option value="idle">正常</option>
              <option value="repairing">维修中</option>
              <option value="scrapped">报废</option>
            </select>
          </div>
          {isAdmin && (
            <div className="w-28 sm:w-36">
              <label className="label">所属部门</label>
              <select value={filters.department_id} onChange={(e) => setFilters({ ...filters, department_id: e.target.value })} className="input">
                <option value="">全部</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">设备类型</th>
                <th className="table-header">品牌</th>
                <th className="table-header">型号</th>
                <th className="table-header">序列号</th>
                <th className="table-header">购置日期</th>
                <th className="table-header">保修期限</th>
                <th className="table-header">存放位置</th>
                <th className="table-header">使用状态</th>
                <th className="table-header">资产价值</th>
                <th className="table-header">上次检修日期</th>
                <th className="table-header">负责人</th>
                <th className="table-header">备注</th>
                <th className="table-header">维修记录</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="14" className="text-center py-8">加载中...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan="14" className="text-center py-8 text-gray-500">暂无数据</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="table-cell">{asset.type?.name || '-'}</td>
                    <td className="table-cell">{asset.brand || '-'}</td>
                    <td className="table-cell">{asset.model || '-'}</td>
                    <td className="table-cell text-xs sm:text-sm">{asset.serial_number || '-'}</td>
                    <td className="table-cell text-xs sm:text-sm">{formatDate(asset.purchase_date)}</td>
                    <td className={`table-cell text-xs sm:text-sm ${isWarrantyExpired(asset.warranty_end_date) ? 'text-red-600 font-semibold' : ''}`}>
                      {asset.warranty_end_date ? (
                        <span className={isWarrantyExpired(asset.warranty_end_date) ? 'bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs sm:text-sm' : ''}>
                          {formatDate(asset.warranty_end_date)}
                          {isWarrantyExpired(asset.warranty_end_date) && ' (已过期)'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="table-cell text-xs sm:text-sm">{asset.location || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusBadgeClass(asset.status)}`}>{getStatusText(asset.status)}</span>
                    </td>
                    <td className="table-cell text-xs sm:text-sm">{formatCurrency(asset.purchase_price)}</td>
                    <td className="table-cell text-xs sm:text-sm">{formatDate(asset.last_repair_date) || '-'}</td>
                    <td className="table-cell text-xs sm:text-sm">{asset.responsible?.real_name || '-'}</td>
                    <td className="table-cell text-xs sm:text-sm max-w-[100px] truncate" title={asset.remarks}>{asset.remarks || '-'}</td>
                    <td className="table-cell text-center">
                      <button 
                        onClick={() => navigate('/repairs')} 
                        className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                      >
                        {asset.repair_count || 0}次
                      </button>
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {asset.status === 'pending' && isAdmin && (
                          <button
                            onClick={() => handleApproveAsset(asset.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            审核通过
                          </button>
                        )}
                        {asset.status === 'pending' && isAdmin && (
                          <button
                            onClick={() => handleRejectAsset(asset.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold rounded-lg hover:from-gray-600 hover:to-gray-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            驳回
                          </button>
                        )}
                        {asset.status === 'pending_delete' && isAdmin && (
                          <button
                            onClick={() => handleConfirmDelete(asset.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold rounded-lg hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            确认删除
                          </button>
                        )}
                        {asset.status === 'pending_delete' && isAdmin && (
                          <button
                            onClick={() => handleRejectDelete(asset.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            拒绝删除
                          </button>
                        )}
                        {asset.status !== 'pending_delete' && asset.status !== 'pending' && (isAdmin || (asset.status !== 'in_use' && asset.status !== 'repairing')) && (
                          <button
                            onClick={() => { setDeleteTarget(asset); setShowDeleteModal(true); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold rounded-lg hover:from-red-600 hover:to-rose-700 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-2">
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
          <div className="flex space-x-2">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-secondary">上一页</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / pageSize)} className="btn btn-secondary">下一页</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl my-4 mx-2">
            <h2 className="text-lg sm:text-xl font-bold mb-4">新增资产</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="label">资产名称 *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">序列号</label>
                  <input type="text" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">设备类型{isAdmin && ' *'}</label>
                  <select value={formData.type_id} onChange={(e) => setFormData({ ...formData, type_id: e.target.value })} className="input" {...(isAdmin ? { required: true } : {})}>
                    <option value="">请选择</option>
                    {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">品牌</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">型号</label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">购置日期</label>
                  <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">购置价格</label>
                  <input type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">供应商</label>
                  <input type="text" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">发票号</label>
                  <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">保修截止日期</label>
                  <input type="date" value={formData.warranty_end_date} onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">存放位置</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">所属部门{isAdmin && ' *'}</label>
                  <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="input" {...(isAdmin ? { required: true } : {})}>
                    <option value="">请选择</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="input" rows="3" />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
                <button type="submit" className="btn btn-primary flex-1">保存</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg my-4 mx-2">
            <h2 className="text-lg sm:text-xl font-bold mb-4">导入资产数据</h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">导入说明</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 支持 .xlsx, .xls, .csv 格式</li>
                  <li>• 日期格式：YYYY-MM-DD</li>
                  <li>• 使用状态可选值：正常、维修中、报废</li>
                </ul>
              </div>

              <div>
                <label className="label">选择文件</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary flex-1"
                  >
                    选择文件
                  </button>
                  {importFile && <span className="text-sm text-gray-600 truncate max-w-[150px]">{importFile.name}</span>}
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                下载导入模板
              </button>

              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="font-medium">{importResult.success ? '导入成功' : '导入失败'}</p>
                  <p className="text-sm">{importResult.message}</p>
                  {importResult.success && importResult.count > 0 && (
                    <p className="text-sm">成功导入 {importResult.count} 条数据</p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {importLoading ? '导入中...' : '开始导入'}
                </button>
                <button
                  onClick={() => { setShowImportModal(false); setImportFile(null); setImportResult(null); }}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm my-4 mx-2 shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-rose-200 mb-4 ring-4 ring-red-50">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">⚠️ 危险操作</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-1">确定要删除全部资产数据吗？</p>
              <p className="text-base sm:text-lg font-bold text-red-600 mb-2">共 {total} 条资产将被永久删除</p>
              <p className="text-xs sm:text-sm text-red-500 mb-6">此操作不可逆，请谨慎操作！</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteAllLoading}
                  className="w-full sm:flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-rose-800 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {deleteAllLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      删除中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      确认全部删除
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  disabled={deleteAllLoading}
                  className="w-full sm:flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm my-4 mx-2 shadow-2xl transform transition-all animate-[scaleIn_0.2s_ease-out]">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-rose-100 mb-4 ring-4 ring-red-50">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">确认删除</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-1">确定要删除资产</p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 mb-1">"{deleteTarget.name}"</p>
              {deleteTarget.serial_number && (
                <p className="text-xs sm:text-sm text-gray-400 mb-4">序列号: {deleteTarget.serial_number}</p>
              )}
              <p className="text-xs sm:text-sm text-red-500 mb-6">此操作不可逆，请谨慎操作</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleDelete}
                  className="w-full sm:flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  确认删除
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                  className="w-full sm:flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentRejection && (
        <RejectionModal
          rejection={currentRejection}
          onClose={handleRejectionClose}
          onReapply={handleReapply}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  );
};

export default Assets;
